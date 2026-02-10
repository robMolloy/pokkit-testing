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

// createRule: @request.auth.id != "" && @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"
// Standard: @request.auth.id != "" && @request.auth.id = id
// Admin:    @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"

describe(`PocketBase globalUserPermissions collection create rules as standard user`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("denies standard user to create a globalUserPermissions record for an existing user if the user has a non admin globalPermissionRecord", async () => {
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
      userPb.collection(globalUserPermissionsCollectionName).create({
        id: user1Record.id,
        userId: user1Record.id,
        ...createGlobalUserPermissionRecordSeedData({ role: "admin" }),
      }),
    ).rejects.toThrow();

    await expect(
      userPb.collection(globalUserPermissionsCollectionName).create({
        id: user2Record.id,
        userId: user2Record.id,
        ...createGlobalUserPermissionRecordSeedData(),
      }),
    ).rejects.toThrow();
  });

  it("denies standard user to create a globalUserPermissions record for an existing user if the user is missing a globalPermission record", async () => {
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
      userPb.collection(globalUserPermissionsCollectionName).create({
        id: user1Record.id,
        userId: user1Record.id,
        ...createGlobalUserPermissionRecordSeedData({ role: "admin" }),
      }),
    ).rejects.toThrow();

    await expect(
      userPb.collection(globalUserPermissionsCollectionName).create({
        id: user2Record.id,
        userId: user2Record.id,
        ...createGlobalUserPermissionRecordSeedData(),
      }),
    ).rejects.toThrow();
  });
});

describe(`PocketBase user collection view rules as admin user`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("allows admin user to create a globalUserPermissions record for an existing user", async () => {
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
      id: adminUserRecord.id,
      userId: adminUserRecord.id,
      ...createGlobalUserPermissionRecordSeedData({ role: "admin" }),
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(adminUserSeed.email, adminUserSeed.password);

    await userPb.collection(globalUserPermissionsCollectionName).create({
      id: user1Record.id,
      userId: user1Record.id,
      ...createGlobalUserPermissionRecordSeedData({ role: "admin" }),
    });

    await superuserPb.collection(globalUserPermissionsCollectionName).create({
      id: user2Record.id,
      userId: user2Record.id,
      ...createGlobalUserPermissionRecordSeedData(),
    });
  });
});
