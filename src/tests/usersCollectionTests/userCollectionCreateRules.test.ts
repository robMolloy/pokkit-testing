import type { ChildProcessWithoutNullStreams } from "child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PocketBase } from "../../config/pocketbaseConfig";
import { setupAndServeSanboxedPbBuildWithDefaults } from "../helpers/_helpers";
import { usersCollectionName } from "../helpers/pocketbaseMetadata";
import { clearDatabase } from "../helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData } from "../helpers/pocketbaseUserHelpers";
import fse from "fs-extra";

const testDirPath = `_temp/usersCollectionCreateRules`;
const testDbUrl = `http://0.0.0.0:8102`;
const testDbSuperuserEmail = "admin@admin.com";
const testDbSuperuserPassword = "admin@admin.com";

const createNewPbInstance = () => new PocketBase(testDbUrl);

let spawnProcess: ChildProcessWithoutNullStreams | undefined;

describe(`PocketBase user collection view rules as standard user`, () => {
  beforeAll(async () => {
    await spawnProcess?.kill("SIGTERM");
    spawnProcess = await setupAndServeSanboxedPbBuildWithDefaults({
      sandboxDirPath: testDirPath,
      sandboxDbUrl: testDbUrl,
    });
  });

  afterAll(async () => {
    await spawnProcess?.kill("SIGTERM");
    spawnProcess = undefined;
    fse.removeSync(testDirPath);
  });

  beforeEach(async () => {
    await clearDatabase({
      dbUrl: testDbUrl,
      dbSuperuserEmail: testDbSuperuserEmail,
      dbSuperuserPassword: testDbSuperuserPassword,
    });
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
