import { PocketBase } from "../../config/pocketbaseConfig";

import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import fse from "fs-extra";
import type { CollectionModel } from "pocketbase";

const serveTempBuildOnPort = async (p: {
  sandboxedPbBuildDirPath: string;
  dbUrl: string;
}): Promise<ChildProcessWithoutNullStreams> => {
  const dbServeUrl = p.dbUrl.replace("http://", "");

  const sandboxedPbBuildFilePath = `${p.sandboxedPbBuildDirPath}/${sandboxedPbBuildFileName}`;
  const pbProcess = spawn(sandboxedPbBuildFilePath, ["serve", `--http=${dbServeUrl}`]);
  const logStream = fse.createWriteStream(`${p.sandboxedPbBuildDirPath}/pocketbase.log`, {
    flags: "a",
  });

  return new Promise((resolve) => {
    pbProcess.stdout.on("data", (data) => {
      const strData = data.toString();
      logStream.write(`[stdout] ${data.toString()}\n`);
      if (strData.includes("Server started at")) resolve(pbProcess);
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
  dbUrl: string;
  dbSuperuserEmail: string;
  dbSuperuserPassword: string;
}) => {
  const appPb = new PocketBase(p.dbUrl);
  await appPb.collection("_superusers").authWithPassword(p.dbSuperuserEmail, p.dbSuperuserPassword);

  const collections = await appPb.collections.getFullList();

  return collections;
};

const importCollectionsToDb = async (p: {
  collections: CollectionModel[];
  dbUrl: string;
  dbSuperuserEmail: string;
  dbSuperuserPassword: string;
}) => {
  const testPb = new PocketBase(p.dbUrl);
  await testPb
    .collection("_superusers")
    .authWithPassword(p.dbSuperuserEmail, p.dbSuperuserPassword);

  await testPb.collections.import(p.collections);
};

export const getFileNameFromFilePath = (filePath: string) => {
  return filePath
    .split("/")
    .filter((x) => !!x)
    .slice(-1)[0]!;
};
export const getPortNumberFromDbUrl = (url: string) => {
  const portNumberStr = url
    .split(":")
    .filter((x) => !!x)
    .slice(-1)[0]
    ?.replace(/\D+/g, "");
  const portNumber = portNumberStr ? parseInt(portNumberStr) : undefined;

  return !portNumber || isNaN(portNumber) ? undefined : portNumber;
};

const sandboxedPbBuildFileName = "sandboxedPbBuild";

const createPbSandboxFromRunningInstance = async (p: {
  pbBuildFilePath: string;
  appDbUrl: string;
  sandboxDirPath: string;
}) => {
  const sandboxedPbBuildFilePath = `${p.sandboxDirPath}/${sandboxedPbBuildFileName}`;

  fse.removeSync(p.sandboxDirPath);

  fse.ensureDirSync(p.sandboxDirPath);
  fse.copyFileSync(p.pbBuildFilePath, sandboxedPbBuildFilePath);

  return { sandboxedPbBuildFilePath };
};

type TSetupAndServeTestDbFromRunningInstance = Parameters<
  typeof setupAndServeTestDbFromRunningInstance
>[0];
export const setupAndServeTestDbFromRunningInstance = async (p: {
  pbBuildFilePath: string;
  appDbUrl: string;
  appDbSuperuserEmail: string;
  appDbSuperuserPassword: string;
  testDirPath: string;
  testDbUrl: string;
  testDbSuperuserEmail: string;
  testDbSuperuserPassword: string;
}) => {
  const { sandboxedPbBuildFilePath } = await createPbSandboxFromRunningInstance({
    pbBuildFilePath: p.pbBuildFilePath,
    appDbUrl: p.appDbUrl,
    sandboxDirPath: p.testDirPath,
  });

  const pbProcess = await serveTempBuildOnPort({
    sandboxedPbBuildDirPath: p.testDirPath,
    dbUrl: p.testDbUrl,
  });
  await upsertAdminCredentials({
    tempTestFilePath: sandboxedPbBuildFilePath,
    testDbSuperuserEmail: p.testDbSuperuserEmail,
    testDbSuperuserPassword: p.testDbSuperuserPassword,
  });

  const collections = await getCollectionsFromDb({
    dbUrl: p.appDbUrl,
    dbSuperuserEmail: p.appDbSuperuserEmail,
    dbSuperuserPassword: p.appDbSuperuserPassword,
  });

  await importCollectionsToDb({
    collections,
    dbUrl: p.testDbUrl,
    dbSuperuserEmail: p.testDbSuperuserEmail,
    dbSuperuserPassword: p.testDbSuperuserPassword,
  });

  return pbProcess;
};
export const setupAndServeTestDbFromRunningInstanceWithDefaults = async (
  p: {
    testDbUrl: string;
    testDirPath: string;
  } & Partial<Omit<TSetupAndServeTestDbFromRunningInstance, "testDirPath" | "testDbUrl">>,
) => {
  return setupAndServeTestDbFromRunningInstance({
    testDbUrl: p.testDbUrl,
    testDirPath: p.testDirPath,
    appDbUrl: p.appDbUrl ?? "http://0.0.0.0:8090",
    appDbSuperuserEmail: p.appDbSuperuserEmail ?? "admin@admin.com",
    appDbSuperuserPassword: p.appDbSuperuserPassword ?? "admin@admin.com",
    testDbSuperuserEmail: p.testDbSuperuserEmail ?? "admin@admin.com",
    testDbSuperuserPassword: p.testDbSuperuserPassword ?? "admin@admin.com",
    pbBuildFilePath: p.pbBuildFilePath ?? "pocketbase/app-db/builds/app-db",
  });
};
