import { beforeEach, describe, expect, it } from "vitest";
import { superuserPb, userPb } from "../../config/pocketbaseConfig";
import {
  globalUserPermissionsCollectionName,
  superusersCollectionName,
  usersCollectionName,
} from "../helpers/pocketbaseMetadata";
import { clearDatabase } from "../helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData, createUserRecord } from "../helpers/pocketbaseUserHelpers";
import { createGlobalUserPermissionRecordSeedData } from "../helpers/globalUserPermissionHelpers";

// listRule: @request.auth.id != "" && (@request.auth.id = id || @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin")
// Standard: @request.auth.id != "" && @request.auth.id = id
// Admin:    @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"

describe(`PocketBase globalUserPermissions collection view rules as standard user`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("allows user to get empty list if own globalUserPermissions record if missing", async () => {
    // throwaway record - first user gains an approved admin global permission
    await createUserRecord({ pb: userPb });

    const user1Data = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: user1Data.email,
      password: user1Data.password,
      passwordConfirm: user1Data.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(user1Data.email, user1Data.password);

    const userGlobalPermissionrecords = await userPb
      .collection(globalUserPermissionsCollectionName)
      .getFullList();
    await expect(userGlobalPermissionrecords.length).toBe(0);
  });

  it("allows user to list own globalUserPermissions record if exists", async () => {
    // throwaway record - first user gains an approved admin global permission
    await createUserRecord({ pb: userPb });

    const user1Data = createUserEmailPasswordData();
    const user1Record = await userPb.collection(usersCollectionName).create({
      email: user1Data.email,
      password: user1Data.password,
      passwordConfirm: user1Data.password,
    });

    // login as superuser to create globalUserPermission record for user1
    await superuserPb
      .collection(superusersCollectionName)
      .authWithPassword("admin@admin.com", "admin@admin.com");
    await superuserPb.collection(globalUserPermissionsCollectionName).create({
      id: user1Record.id,
      userId: user1Record.id,
      ...createGlobalUserPermissionRecordSeedData(),
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(user1Data.email, user1Data.password);

    const userGlobalPermissionrecords = await userPb
      .collection(globalUserPermissionsCollectionName)
      .getFullList();
    await expect(userGlobalPermissionrecords.length).toBe(1);
  });

  it("allows user to list globalUserPermission records but filters out any that are not their own", async () => {
    // throwaway record - first user gains an approved admin global permission
    await createUserRecord({ pb: userPb });

    const user1Data = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: user1Data.email,
      password: user1Data.password,
      passwordConfirm: user1Data.password,
    });

    const user2Data = createUserEmailPasswordData();
    const user2Record = await userPb.collection(usersCollectionName).create({
      email: user2Data.email,
      password: user2Data.password,
      passwordConfirm: user2Data.password,
    });

    await superuserPb
      .collection(superusersCollectionName)
      .authWithPassword("admin@admin.com", "admin@admin.com");

    await superuserPb.collection(globalUserPermissionsCollectionName).create({
      id: user2Record.id,
      userId: user2Record.id,
      ...createGlobalUserPermissionRecordSeedData(),
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(user1Data.email, user1Data.password);

    // attempt to get all globalUserPermission records does not return user2's record
    const userGlobalPermissionrecords = await userPb
      .collection(globalUserPermissionsCollectionName)
      .getFullList();
    await expect(userGlobalPermissionrecords.length).toBe(0);
  });

  it("allows logged out user to return an empty list of globalUserPermission records", async () => {
    // throwaway record - first user gains an approved admin global permission
    await createUserRecord({ pb: userPb });

    const user1Data = createUserEmailPasswordData();
    const user1Record = await userPb.collection(usersCollectionName).create({
      email: user1Data.email,
      password: user1Data.password,
      passwordConfirm: user1Data.password,
    });

    await superuserPb
      .collection(superusersCollectionName)
      .authWithPassword("admin@admin.com", "admin@admin.com");

    await superuserPb.collection(globalUserPermissionsCollectionName).create({
      id: user1Record.id,
      userId: user1Record.id,
      ...createGlobalUserPermissionRecordSeedData(),
    });

    // attempt to get user2's globalUserPermission record
    const userGlobalPermissionrecords = await userPb
      .collection(globalUserPermissionsCollectionName)
      .getFullList();
    await expect(userGlobalPermissionrecords.length).toBe(0);
  });
});

describe(`PocketBase user collection view rules as admin user`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("allows admin user to list any globalUserPermissions record if exists", async () => {
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
    const adminUserSeed = createUserEmailPasswordData();
    const adminUserRecord = await userPb.collection(usersCollectionName).create({
      email: adminUserSeed.email,
      password: adminUserSeed.password,
      passwordConfirm: adminUserSeed.password,
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
      id: adminUserRecord.id,
      userId: adminUserRecord.id,
      ...createGlobalUserPermissionRecordSeedData({ role: "admin" }),
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(adminUserSeed.email, adminUserSeed.password);

    const globalPermissionRecords = await userPb
      .collection(globalUserPermissionsCollectionName)
      .getFullList();
    expect(globalPermissionRecords.length).toBe(4);
  });
});
