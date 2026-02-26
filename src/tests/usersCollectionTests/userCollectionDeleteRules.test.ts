import type { ChildProcessWithoutNullStreams } from "child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PocketBase } from "../../config/pocketbaseConfig";
import { setupAndServeTestDbFromRunningInstanceWithDefaults } from "../helpers/_helpers";
import { usersCollectionName } from "../helpers/pocketbaseMetadata";
import { clearDatabase } from "../helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData, createUserRecord } from "../helpers/pocketbaseUserHelpers";
import fse from "fs-extra";

// id = @request.auth.id

const testDirPath = `_temp/usersCollectionDeleteRules`;
const testDbUrl = `http://0.0.0.0:8103`;
const testDbSuperuserEmail = "admin@admin.com";
const testDbSuperuserPassword = "admin@admin.com";

const createNewPbInstance = () => new PocketBase(testDbUrl);

let spawnProcess: ChildProcessWithoutNullStreams | undefined;

describe(`PocketBase user collection delete rules as user`, () => {
  beforeAll(async () => {
    await spawnProcess?.kill("SIGTERM");
    spawnProcess = await setupAndServeTestDbFromRunningInstanceWithDefaults({
      testDirPath,
      testDbUrl,
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

  it("allows user to delete own record", async () => {
    const userPb = createNewPbInstance();

    const userData = createUserEmailPasswordData();
    const userRecord = await userPb.collection(usersCollectionName).create({
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(userData.email, userData.password);

    await userPb.collection(usersCollectionName).delete(userRecord.id);
  });

  it("denies user delete to other user's record", async () => {
    // throwaway record - first user gains an approved admin global

    const userPb = createNewPbInstance();
    await createUserRecord({ pb: userPb });

    const userData = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.password,
    });

    const userData2 = createUserEmailPasswordData();
    const userRecord2 = await userPb.collection(usersCollectionName).create({
      email: userData2.email,
      password: userData2.password,
      passwordConfirm: userData2.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(userData.email, userData.password);

    // Attempt to delete other user's record should fail
    await expect(userPb.collection(usersCollectionName).delete(userRecord2.id)).rejects.toThrow();
  });
});
