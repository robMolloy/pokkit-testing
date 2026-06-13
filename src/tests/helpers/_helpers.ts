import { PocketBase } from "../../config/pocketbaseConfig";

import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import fse from "fs-extra";
import type { CollectionModel } from "pocketbase";

const sandboxedPbBuildFileName = "sandboxedPbBuild";

const getDbServeUrlFromDbUrl = (dbUrl: string) => dbUrl.replace("http://", "");

/**
 * Starts a sandboxed PocketBase build and waits until the server reports it is listening.
 * Logs are appended to `pocketbase.log` in the sandbox directory.
 */
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

/** Creates or updates the superuser credentials via the PocketBase CLI `superuser upsert` command. */
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

/** Authenticates as superuser and returns the full collection schema from a running PocketBase instance. */
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

/** Authenticates as superuser and imports collection definitions into a PocketBase instance. */
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

/**
 * Prepares an isolated sandbox directory by copying the PocketBase build binary
 * into it as `sandboxedPbBuild`.
 */
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
/**
 * Creates a sandbox PocketBase instance, serves it, seeds superuser credentials,
 * and copies collection schemas from the app database into the sandbox.
 */
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

/**
 * Convenience wrapper around {@link setupAndServeSanboxedPbBuild} that fills in
 * standard app and sandbox paths, URLs, and superuser credentials when omitted.
 */
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
