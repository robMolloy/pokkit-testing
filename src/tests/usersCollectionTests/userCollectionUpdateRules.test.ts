import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PocketBase } from "../../config/pocketbaseConfig";
import { usersCollectionName } from "../helpers/pocketbaseMetadata";
import { createUserEmailPasswordData, createUserRecord } from "../helpers/pocketbaseUserHelpers";
import type { ChildProcessWithoutNullStreams } from "child_process";
import { setupAndServeTestDb } from "../helpers/_helpers";
import { clearDatabase } from "../helpers/pocketbaseTestHelpers";
import fse from "fs-extra";

// id = @request.auth.id

const pocketbaseBuildFilePath = `pocketbase/app-db/builds/app-db`;
const testDirPath = `_temp/usersCollectionUpdateRules`;

const appDbUrl = "http://0.0.0.0:8090";
const appDbSuperuserEmail = "admin@admin.com";
const appDbSuperuserPassword = "admin@admin.com";
const testDbUrl = `http://0.0.0.0:8105`;
const testDbSuperuserEmail = "admin@admin.com";
const testDbSuperuserPassword = "admin@admin.com";

const createNewPbInstance = () => new PocketBase(testDbUrl);

let spawnProcess: ChildProcessWithoutNullStreams | undefined;

describe(`PocketBase user collection update rules as user`, () => {
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
    fse.removeSync(testDirPath);
  });

  beforeEach(async () => {
    await clearDatabase({
      dbUrl: testDbUrl,
      dbSuperuserEmail: testDbSuperuserEmail,
      dbSuperuserPassword: testDbSuperuserPassword,
    });
  });

  it("allows user to update own record", async () => {
    const userPb = createNewPbInstance();

    // throwaway record - first user gains an approved admin global permission
    await createUserRecord({ pb: userPb });

    const userData = createUserEmailPasswordData();
    const userRecord = await userPb.collection(usersCollectionName).create({
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(userData.email, userData.password);

    await userPb.collection(usersCollectionName).update(userRecord.id, {
      emailVisibility: true,
    });

    const resp = await userPb.collection(usersCollectionName).getOne(userRecord.id);
    expect(resp.id).toBe(userRecord.id);
    expect(resp.emailVisibility).toBe(true);
  });

  it("denies standard user to update own record's email", async () => {
    const userPb = createNewPbInstance();

    // throwaway record - first user gains an approved admin global permission
    await createUserRecord({ pb: userPb });
    const userData = createUserEmailPasswordData();
    const userRecord = await userPb.collection(usersCollectionName).create({
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.password,
    });

    const userData2 = createUserEmailPasswordData();

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(userData.email, userData.password);

    // Attempt to update email should fail
    await expect(
      userPb.collection(usersCollectionName).update(userRecord.id, {
        email: userData2.email,
      }),
    ).rejects.toThrow();
  });

  it("denies user update to other user's record", async () => {
    const userPb = createNewPbInstance();
    // throwaway record - first user gains an approved admin global permission
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

    // Attempt to update other user's record should fail
    await expect(
      userPb.collection(usersCollectionName).update(userRecord2.id, {
        emailVisibility: true,
      }),
    ).rejects.toThrow();
  });
});
