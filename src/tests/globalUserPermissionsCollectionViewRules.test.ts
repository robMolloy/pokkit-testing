import { beforeEach, describe, expect, it } from "vitest";
import { superuserPb, userPb } from "../config/pocketbaseConfig";
import {
  globalUserPermissionsCollectionName,
  superusersCollectionName,
  usersCollectionName,
} from "./helpers/pocketbaseMetadata";
import { clearDatabase } from "./helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData, createUserRecord } from "./helpers/pocketbaseUserHelpers";
import { createGlobalUserPermissionRecordSeedData } from "./helpers/globalUserPermissionHelpers";

// @request.auth.id=id || @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role = "admin"
// Standard: @request.auth.id = id
// Admin:    @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role = "admin"

describe(`PocketBase globalUserPermissions collection view rules as standard user`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("denies user to view own globalUserPermissions record if missing", async () => {
    // throwaway record - first user gains an approved admin global permission
    await createUserRecord({ pb: userPb });
    const userData = createUserEmailPasswordData();
    const userDataRecord = await userPb.collection(usersCollectionName).create({
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(userData.email, userData.password);

    await expect(
      userPb.collection(globalUserPermissionsCollectionName).getOne(userDataRecord.id),
    ).rejects.toThrow();
  });

  it("allows user to view own globalUserPermissions record if exists", async () => {
    // throwaway record - first user gains an approved admin global permission
    await createUserRecord({ pb: userPb });

    const userData = createUserEmailPasswordData();
    const userDataRecord = await userPb.collection(usersCollectionName).create({
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.password,
    });

    await superuserPb
      .collection(superusersCollectionName)
      .authWithPassword("admin@admin.com", "admin@admin.com");

    await superuserPb.collection(globalUserPermissionsCollectionName).create({
      id: userDataRecord.id,
      userId: userDataRecord.id,
      ...createGlobalUserPermissionRecordSeedData(),
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(userData.email, userData.password);

    const userGlobalPermission = await userPb
      .collection(globalUserPermissionsCollectionName)
      .getOne(userDataRecord.id);

    expect(userGlobalPermission.id).toBe(userDataRecord.id);
    expect(userGlobalPermission.role).toBe("standard");
    expect(userGlobalPermission.status).toBe("approved");
    expect(userGlobalPermission.userId).toBe(userDataRecord.id);
  });
  it("denies user to view other user's globalUserPermissions", async () => {
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

    // attempt to get user2's globalUserPermission record
    await expect(
      userPb.collection(globalUserPermissionsCollectionName).getOne(user2Record.id),
    ).rejects.toThrow();
  });

  it("denies logged out user to view a user's globalUserPermissions", async () => {
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
    await expect(
      userPb.collection(globalUserPermissionsCollectionName).getOne(user1Record.id),
    ).rejects.toThrow();
  });
});

describe(`PocketBase user collection view rules as admin user`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("allows admin user to view any globalUserPermissions record if exists", async () => {
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

    await superuserPb.collection(globalUserPermissionsCollectionName).getOne(user1Record.id);

    const user1GlobalPermissionRecord = await userPb
      .collection(globalUserPermissionsCollectionName)
      .getOne(user1Record.id);
    expect(user1GlobalPermissionRecord.id).toBe(user1Record.id);
    expect(user1GlobalPermissionRecord.userId).toBe(user1Record.id);

    const user2GlobalPermissionRecord = await userPb
      .collection(globalUserPermissionsCollectionName)
      .getOne(user2Record.id);
    expect(user2GlobalPermissionRecord.id).toBe(user2Record.id);
    expect(user2GlobalPermissionRecord.userId).toBe(user2Record.id);

    const adminUserGlobalPermissionRecord = await userPb
      .collection(globalUserPermissionsCollectionName)
      .getOne(adminUserRecord.id);
    expect(adminUserGlobalPermissionRecord.id).toBe(adminUserRecord.id);
    expect(adminUserGlobalPermissionRecord.userId).toBe(adminUserRecord.id);
  });
});
