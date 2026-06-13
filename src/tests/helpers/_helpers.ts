import { PocketBase } from "../../config/pocketbaseConfig";

import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import fse from "fs-extra";
import type { CollectionModel } from "pocketbase";

const sandboxedPbBuildFileName = "sandboxedPbBuild";
const getDbServeUrlFromDbUrl = (dbUrl: string) => dbUrl.replace("http://", "");

const serveSandboxPbBuild = async (p: {
  sandboxDirPath: string;
  dbUrl: string;
}): Promise<ChildProcessWithoutNullStreams> => {
  const dbServeUrl = getDbServeUrlFromDbUrl(p.dbUrl);

  const sandboxedPbBuildFilePath = `${p.sandboxDirPath}/${sandboxedPbBuildFileName}`;
  const pbProcess = spawn(sandboxedPbBuildFilePath, ["serve", `--http=${dbServeUrl}`]);
  const logStream = fse.createWriteStream(`${p.sandboxDirPath}/pocketbase.log`, {
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
  pbBuildFilePath: string;
  dbSuperuserEmail: string;
  dbSuperuserPassword: string;
}) => {
  const upsertProcess = spawn(`${p.pbBuildFilePath}`, [
    "superuser",
    "upsert",
    p.dbSuperuserEmail,
    p.dbSuperuserPassword,
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

type TSetupAndServeTestDbFromRunningInstance = Parameters<typeof setupAndServeSanboxedPbBuild>[0];
export const setupAndServeSanboxedPbBuild = async (p: {
  pbBuildFilePath: string;
  appDbUrl: string;
  appDbSuperuserEmail: string;
  appDbSuperuserPassword: string;
  sandboxDirPath: string;
  sandboxDbUrl: string;
  sandboxDbSuperuserEmail: string;
  sandboxDbSuperuserPassword: string;
}) => {
  const { sandboxedPbBuildFilePath } = await createPbSandboxFromRunningInstance({
    pbBuildFilePath: p.pbBuildFilePath,
    appDbUrl: p.appDbUrl,
    sandboxDirPath: p.sandboxDirPath,
  });

  const pbProcess = await serveSandboxPbBuild({
    sandboxDirPath: p.sandboxDirPath,
    dbUrl: p.sandboxDbUrl,
  });
  await upsertAdminCredentials({
    pbBuildFilePath: sandboxedPbBuildFilePath,
    dbSuperuserEmail: p.sandboxDbSuperuserEmail,
    dbSuperuserPassword: p.sandboxDbSuperuserPassword,
  });

  const collections = await getCollectionsFromDb({
    dbUrl: p.appDbUrl,
    dbSuperuserEmail: p.appDbSuperuserEmail,
    dbSuperuserPassword: p.appDbSuperuserPassword,
  });

  await importCollectionsToDb({
    collections,
    dbUrl: p.sandboxDbUrl,
    dbSuperuserEmail: p.sandboxDbSuperuserEmail,
    dbSuperuserPassword: p.sandboxDbSuperuserPassword,
  });

  return pbProcess;
};

export const setupAndServeSanboxedPbBuildWithDefaults = async (
  p: {
    sandboxDbUrl: string;
    sandboxDirPath: string;
  } & Partial<Omit<TSetupAndServeTestDbFromRunningInstance, "sandboxDirPath" | "sandboxDbUrl">>,
) => {
  return setupAndServeSanboxedPbBuild({
    pbBuildFilePath: p.pbBuildFilePath ?? "pocketbase/app-db/builds/app-db",
    appDbUrl: p.appDbUrl ?? "http://0.0.0.0:8090",
    appDbSuperuserEmail: p.appDbSuperuserEmail ?? "admin@admin.com",
    appDbSuperuserPassword: p.appDbSuperuserPassword ?? "admin@admin.com",
    sandboxDbUrl: p.sandboxDbUrl,
    sandboxDirPath: p.sandboxDirPath,
    sandboxDbSuperuserEmail: p.sandboxDbSuperuserEmail ?? "admin@admin.com",
    sandboxDbSuperuserPassword: p.sandboxDbSuperuserPassword ?? "admin@admin.com",
  });
};
