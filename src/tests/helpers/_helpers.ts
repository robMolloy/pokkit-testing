import { PocketBase } from "../../config/pocketbaseConfig";

import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import fse from "fs-extra";

const serveTempBuildOnPort = async (p: {
  tempTestFilePath: string;
  tempTestDirPath: string;
  portNumber: string;
}): Promise<ChildProcessWithoutNullStreams> => {
  const pbProcess = spawn(p.tempTestFilePath, ["serve", `--http=0.0.0.0:${p.portNumber}`]);
  const logStream = fse.createWriteStream(`${p.tempTestDirPath}/pocketbase.log`, { flags: "a" });

  return new Promise((resolve) => {
    pbProcess.stdout.on("data", (data) => {
      const strData = data.toString();
      logStream.write(`[stdout] ${data.toString()}\n`);
      if (strData.includes(p.portNumber)) resolve(pbProcess);
    });

    pbProcess.stderr.on("data", (data) => {
      logStream.write(`[stderr] ${data.toString()}\n`);
    });

    pbProcess.on("error", (error) => {
      logStream.write(`[error] ${error.message}\n`);
      logStream.end();
    });
  });
};

const upsertAdminCredentials = async (p: {
  tempTestFilePath: string;
  testDbSuperuserEmail: string;
  testDbSuperuserPassword: string;
}) => {
  const upsertProcess = spawn(`${p.tempTestFilePath}`, [
    "superuser",
    "upsert",
    p.testDbSuperuserEmail,
    p.testDbSuperuserPassword,
  ]);

  return new Promise((resolve) => {
    upsertProcess.stdout.on("data", (data) => {
      if (data.toString().includes("Successfully saved")) resolve(true);
    });
  });
};

const getCollectionsFromDb = async (p: {
  appDbUrl: string;
  testDbUrl: string;
  appDbSuperuserEmail: string;
  appDbSuperuserPassword: string;
  testDbSuperuserEmail: string;
  testDbSuperuserPassword: string;
}) => {
  const appPb = new PocketBase(p.appDbUrl);
  await appPb
    .collection("_superusers")
    .authWithPassword(p.appDbSuperuserEmail, p.appDbSuperuserPassword);

  const collections = await appPb.collections.getFullList();

  const testPb = new PocketBase(p.testDbUrl);
  await testPb
    .collection("_superusers")
    .authWithPassword(p.testDbSuperuserEmail, p.testDbSuperuserPassword);

  await testPb.collections.import(collections);
};

export const setupAndServeTestDb = async (p: {
  spawnProcess: ChildProcessWithoutNullStreams | undefined;
  tempTestDirPath: string;
  tempTestFilePath: string;
  buildFilePath: string;
  appDbUrl: string;
  appDbSuperuserEmail: string;
  appDbSuperuserPassword: string;
  testDbUrl: string;
  testDbSuperuserEmail: string;
  testDbSuperuserPassword: string;
}) => {
  const testDbPortNumber = p.testDbUrl.split(":").slice(-1)[0];
  if (!testDbPortNumber) return;

  await p.spawnProcess?.kill("SIGTERM");
  // deleteTempTestDir
  fse.removeSync(p.tempTestDirPath);

  // copyBuildToTempFolder
  fse.ensureDirSync(p.tempTestDirPath);
  fse.copyFileSync(p.buildFilePath, p.tempTestFilePath);
  const pbProcess = await serveTempBuildOnPort({
    tempTestFilePath: p.tempTestFilePath,
    tempTestDirPath: p.tempTestDirPath,
    portNumber: testDbPortNumber,
  });
  await upsertAdminCredentials({
    tempTestFilePath: p.tempTestFilePath,
    testDbSuperuserEmail: p.testDbSuperuserEmail,
    testDbSuperuserPassword: p.testDbSuperuserPassword,
  });
  await getCollectionsFromDb({
    appDbUrl: p.appDbUrl,
    testDbUrl: p.testDbUrl,
    appDbSuperuserEmail: p.appDbSuperuserEmail,
    appDbSuperuserPassword: p.appDbSuperuserPassword,
    testDbSuperuserEmail: p.testDbSuperuserEmail,
    testDbSuperuserPassword: p.testDbSuperuserPassword,
  });

  return pbProcess;
};
