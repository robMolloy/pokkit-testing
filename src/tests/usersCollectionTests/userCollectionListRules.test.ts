import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PocketBase } from "../../config/pocketbaseConfig";
import {
  globalUserPermissionsCollectionName,
  usersCollectionName,
} from "../helpers/pocketbaseMetadata";
import { clearDatabase } from "../helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData, createUserRecord } from "../helpers/pocketbaseUserHelpers";

import { type ChildProcessWithoutNullStreams } from "child_process";
import { setupAndServeTestDb } from "../helpers/_helpers";

// @request.auth.id = id || @collection.globalUserPermissions.userId ?= @request.auth.id && @collection.globalUserPermissions.role = "admin"
// Standard: @request.auth.id = id
// Admin:    @collection.globalUserPermissions.userId ?= @request.auth.id && @collection.globalUserPermissions.role = "admin"

const pocketbaseBuildFilePath = `pocketbase/app-db/builds/app-db`;
const testDirPath = `_temp/usersCollectionListRules`;

const appDbUrl = "http://0.0.0.0:8090";
const appDbSuperuserEmail = "admin@admin.com";
const appDbSuperuserPassword = "admin@admin.com";
const testDbUrl = `http://0.0.0.0:8104`;
const testDbSuperuserEmail = "admin@admin.com";
const testDbSuperuserPassword = "admin@admin.com";

let spawnProcess: ChildProcessWithoutNullStreams | undefined;
describe(`PocketBase user collection list rules as standard user`, () => {
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
    await clearDatabase({
      dbUrl: testDbUrl,
      dbSuperuserEmail: testDbSuperuserEmail,
      dbSuperuserPassword: testDbSuperuserPassword,
    });
  });

  it("allows user to list own record", async () => {
    const userPb = new PocketBase(testDbUrl);
    await createUserRecord({ pb: userPb });
    const userData = createUserEmailPasswordData();
    const createResp = await userPb.collection(usersCollectionName).create({
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(userData.email, userData.password);
    const resp = await userPb.collection(usersCollectionName).getFullList();

    expect(resp.length).toBe(1);
    expect(resp[0]?.id).toBe(createResp.id);
  });

  it("deny logged out user to list any users record", async () => {
    const userPb = new PocketBase(testDbUrl);
    // throwaway record - first user gains an approved admin global permission
    await createUserRecord({ pb: userPb });

    const userData1 = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: userData1.email,
      password: userData1.password,
      passwordConfirm: userData1.password,
    });

    const userData2 = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: userData2.email,
      password: userData2.password,
      passwordConfirm: userData2.password,
    });

    const resp = await userPb.collection(usersCollectionName).getFullList();
    expect(resp.length).toBe(0);
  });

  it("allow admin user to list all user records (inc. own)", async () => {
    const userPb = new PocketBase(testDbUrl);
    const adminUserData = createUserEmailPasswordData();
    const adminUserRecord = await userPb.collection(usersCollectionName).create({
      email: adminUserData.email,
      password: adminUserData.password,
      passwordConfirm: adminUserData.password,
    });

    const userData1 = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: userData1.email,
      password: userData1.password,
      passwordConfirm: userData1.password,
    });

    const userData2 = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: userData2.email,
      password: userData2.password,
      passwordConfirm: userData2.password,
    });

    // log in as admin user
    await userPb
      .collection(usersCollectionName)
      .authWithPassword(adminUserData.email, adminUserData.password);

    // check user has admin global permission
    const adminGlobalUserPermissionRecord = await userPb
      .collection(globalUserPermissionsCollectionName)
      .getOne(adminUserRecord.id);
    expect(adminGlobalUserPermissionRecord.role).toBe("admin");

    const resp1 = await userPb.collection(usersCollectionName).getFullList();
    expect(resp1.length).toBe(3);
  });
});
