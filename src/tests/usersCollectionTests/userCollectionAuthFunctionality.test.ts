import type { ChildProcessWithoutNullStreams } from "child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PocketBase } from "../../config/pocketbaseConfig";
import { setupAndServeTestDb } from "../helpers/_helpers";
import { usersCollectionName } from "../helpers/pocketbaseMetadata";
import { clearSpecifiedDatabase } from "../helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData } from "../helpers/pocketbaseUserHelpers";

const pocketbaseBuildFilePath = `pocketbase/app-db/builds/app-db`;
const testDirPath = `_temp/usersCollectionAuthFunctionality`;

const appDbUrl = "http://0.0.0.0:8090";
const appDbSuperuserEmail = "admin@admin.com";
const appDbSuperuserPassword = "admin@admin.com";
const testDbUrl = `http://0.0.0.0:8101`;
const testDbSuperuserEmail = "admin@admin.com";
const testDbSuperuserPassword = "admin@admin.com";

const createNewPbInstance = () => new PocketBase(testDbUrl);

let spawnProcess: ChildProcessWithoutNullStreams | undefined;

describe(`PocketBase user collection view rules as standard user`, () => {
  beforeAll(async () => {
    spawnProcess = await setupAndServeTestDb({
      spawnProcess,
      pocketbaseBuildFilePath,
      testDirPath,
      appDbUrl,
      appDbSuperuserEmail,
      appDbSuperuserPassword,
      testDbUrl,
      testDbSuperuserEmail,
      testDbSuperuserPassword,
    });
  });

  afterAll(async () => {
    await spawnProcess?.kill("SIGTERM");
    spawnProcess = undefined;
  });

  beforeEach(async () => {
    await clearSpecifiedDatabase({ testDbUrl, testDbSuperuserEmail, testDbSuperuserPassword });
  });

  it("deny log in: with non-existent user", async () => {
    const userPb = createNewPbInstance();

    await expect(
      userPb.collection(usersCollectionName).authWithPassword("test@example.com", "wrong-password"),
    ).rejects.toThrow();
  });

  it("deny log in: with incorrect creds", async () => {
    const userPb = createNewPbInstance();

    const userData1 = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: userData1.email,
      password: userData1.password,
      passwordConfirm: userData1.password,
    });

    await expect(
      userPb
        .collection(usersCollectionName)
        .authWithPassword(userData1.email, "incorrect-password"),
    ).rejects.toThrow();
  });

  it("allow log in: with correct creds", async () => {
    const userPb = createNewPbInstance();

    const userData1 = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: userData1.email,
      password: userData1.password,
      passwordConfirm: userData1.password,
    });

    await expect(
      userPb.collection(usersCollectionName).authWithPassword(userData1.email, userData1.password),
    ).resolves.not.toThrow();
  });
});
