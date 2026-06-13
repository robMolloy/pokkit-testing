import type { ChildProcessWithoutNullStreams } from "child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PocketBase } from "../../config/pocketbaseConfig";
import { setupAndServeSanboxedPbBuildWithDefaults } from "../helpers/_helpers";
import { createGlobalUserPermissionRecordSeedData } from "../helpers/globalUserPermissionHelpers";
import {
  globalUserPermissionsCollectionName,
  superusersCollectionName,
  usersCollectionName,
} from "../helpers/pocketbaseMetadata";
import { clearDatabase } from "../helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData, createUserRecord } from "../helpers/pocketbaseUserHelpers";
import fse from "fs-extra";

// updateRule: @request.auth.id != "" && @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"
// Standard: @request.auth.id != "" && @request.auth.id = id
// Admin:    @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"

const testDirPath = `_temp/globalUserPermissionsCollectionUpdateRules`;
const testDbUrl = `http://0.0.0.0:8064`;
const testDbSuperuserEmail = "admin@admin.com";
const testDbSuperuserPassword = "admin@admin.com";

const createPbInstance = () => new PocketBase(testDbUrl);

let spawnProcess: ChildProcessWithoutNullStreams | undefined;

describe(`PocketBase globalUserPermissions collection view rules as standard user`, () => {
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

  it("denies standard user to update a globalUserPermissions record for an existing user if the user has a non admin globalPermissionRecord", async () => {
    const superuserPb = createPbInstance();
    const userPb = createPbInstance();

    // throwaway record - first user gains an approved admin global permission
    await createUserRecord({ pb: userPb });

    const user1Seed = createUserEmailPasswordData();
    const user1Record = await userPb.collection(usersCollectionName).create({
      email: user1Seed.email,
      password: user1Seed.password,
      passwordConfirm: user1Seed.password,
    });
    const user2Seed = createUserEmailPasswordData();
    const user2Record = await userPb.collection(usersCollectionName).create({
      email: user2Seed.email,
      password: user2Seed.password,
      passwordConfirm: user2Seed.password,
    });
    const user3Seed = createUserEmailPasswordData();
    const user3Record = await userPb.collection(usersCollectionName).create({
      email: user3Seed.email,
      password: user3Seed.password,
      passwordConfirm: user3Seed.password,
    });

    await superuserPb
      .collection(superusersCollectionName)
      .authWithPassword("admin@admin.com", "admin@admin.com");

    await superuserPb.collection(globalUserPermissionsCollectionName).create({
      id: user3Record.id,
      userId: user3Record.id,
      ...createGlobalUserPermissionRecordSeedData(),
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(user3Seed.email, user3Seed.password);

    await expect(
      userPb
        .collection(globalUserPermissionsCollectionName)
        .update(user1Record.id, { role: "admin" }),
    ).rejects.toThrow();

    await expect(
      userPb
        .collection(globalUserPermissionsCollectionName)
        .update(user2Record.id, { status: "blocked" }),
    ).rejects.toThrow();
  });

  it("denies standard user to update a globalUserPermissions record for an existing user if the user is missing a globalPermission record", async () => {
    const userPb = createPbInstance();

    // throwaway record - first user gains an approved admin global permission
    await createUserRecord({ pb: userPb });

    const user1Seed = createUserEmailPasswordData();
    const user1Record = await userPb.collection(usersCollectionName).create({
      email: user1Seed.email,
      password: user1Seed.password,
      passwordConfirm: user1Seed.password,
    });
    const user2Seed = createUserEmailPasswordData();
    const user2Record = await userPb.collection(usersCollectionName).create({
      email: user2Seed.email,
      password: user2Seed.password,
      passwordConfirm: user2Seed.password,
    });
    const user3Seed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: user3Seed.email,
      password: user3Seed.password,
      passwordConfirm: user3Seed.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(user3Seed.email, user3Seed.password);

    await expect(
      userPb
        .collection(globalUserPermissionsCollectionName)
        .update(user1Record.id, { role: "admin" }),
    ).rejects.toThrow();

    await expect(
      userPb
        .collection(globalUserPermissionsCollectionName)
        .update(user2Record.id, { status: "blocked" }),
    ).rejects.toThrow();
  });

  it("allows admin user to update a globalUserPermissions record for an existing user", async () => {
    const superuserPb = createPbInstance();
    const userPb = createPbInstance();
    // throwaway record - first user gains an approved admin global permission
    await createUserRecord({ pb: userPb });

    const user1Seed = createUserEmailPasswordData();
    const user1Record = await userPb.collection(usersCollectionName).create({
      email: user1Seed.email,
      password: user1Seed.password,
      passwordConfirm: user1Seed.password,
    });
    const user2Seed = createUserEmailPasswordData();
    const user2Record = await userPb.collection(usersCollectionName).create({
      email: user2Seed.email,
      password: user2Seed.password,
      passwordConfirm: user2Seed.password,
    });
    const adminUser1Seed = createUserEmailPasswordData();
    const adminUser1Record = await userPb.collection(usersCollectionName).create({
      email: adminUser1Seed.email,
      password: adminUser1Seed.password,
      passwordConfirm: adminUser1Seed.password,
    });

    const adminUser2Seed = createUserEmailPasswordData();
    const adminUser2Record = await userPb.collection(usersCollectionName).create({
      email: adminUser2Seed.email,
      password: adminUser2Seed.password,
      passwordConfirm: adminUser2Seed.password,
    });

    await superuserPb
      .collection(superusersCollectionName)
      .authWithPassword("admin@admin.com", "admin@admin.com");

    await superuserPb.collection(globalUserPermissionsCollectionName).create({
      id: user1Record.id,
      userId: user1Record.id,
      ...createGlobalUserPermissionRecordSeedData(),
    });
    await superuserPb.collection(globalUserPermissionsCollectionName).create({
      id: user2Record.id,
      userId: user2Record.id,
      ...createGlobalUserPermissionRecordSeedData(),
    });
    await superuserPb.collection(globalUserPermissionsCollectionName).create({
      id: adminUser1Record.id,
      userId: adminUser1Record.id,
      ...createGlobalUserPermissionRecordSeedData({ role: "admin" }),
    });
    await superuserPb.collection(globalUserPermissionsCollectionName).create({
      id: adminUser2Record.id,
      userId: adminUser2Record.id,
      ...createGlobalUserPermissionRecordSeedData({ role: "admin" }),
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(adminUser1Seed.email, adminUser1Seed.password);

    await userPb
      .collection(globalUserPermissionsCollectionName)
      .update(user1Record.id, { role: "admin" });
    await userPb
      .collection(globalUserPermissionsCollectionName)
      .update(user2Record.id, { status: "blocked" });
    await userPb
      .collection(globalUserPermissionsCollectionName)
      .update(adminUser2Record.id, { role: "standard" });
  });
});
