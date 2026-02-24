import type { ChildProcessWithoutNullStreams } from "child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PocketBase } from "../../config/pocketbaseConfig";
import { setupAndServeTestDb } from "../helpers/_helpers";
import { usersCollectionName } from "../helpers/pocketbaseMetadata";
import { clearSpecifiedDatabase } from "../helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData } from "../helpers/pocketbaseUserHelpers";

const pocketbaseBuildFilePath = `pocketbase/app-db/builds/app-db`;
const testDirPath = `_temp/usersCollectionCreateRules`;

const appDbUrl = "http://0.0.0.0:8090";
const appDbSuperuserEmail = "admin@admin.com";
const appDbSuperuserPassword = "admin@admin.com";
const testDbUrl = `http://0.0.0.0:8102`;
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

  it("allows logged out user to create record", async () => {
    const userPb = createNewPbInstance();

    const userData = createUserEmailPasswordData();
    // validated by no errors being thrown
    const createResp = await userPb.collection(usersCollectionName).create({
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.password,
    });

    // validated by logging user in - not strictly necessary
    await userPb
      .collection(usersCollectionName)
      .authWithPassword(userData.email, userData.password);

    const loggedInUserRecord = await userPb.collection(usersCollectionName).getOne(createResp.id);
    expect(loggedInUserRecord.id).toBe(createResp.id);
  });
});
