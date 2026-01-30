import { beforeEach, describe, expect, it } from "vitest";
import { userPb } from "../config/pocketbaseConfig";
import {
  globalUserPermissionsCollectionName,
  usersCollectionName,
} from "./helpers/pocketbaseMetadata";
import { clearDatabase } from "./helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData, createUserRecord } from "./helpers/pocketbaseUserHelpers";

// @request.auth.id = id || @collection.globalUserPermissions.userId ?= @request.auth.id && @collection.globalUserPermissions.role = "admin"
// Standard: @request.auth.id = id
// Admin:    @collection.globalUserPermissions.userId ?= @request.auth.id && @collection.globalUserPermissions.role = "admin"

describe(`PocketBase user collection view rules as standard user`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("allows user to view own record", async () => {
    // throwaway record - first user gains an approved admin global permission
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
    const resp = await userPb.collection(usersCollectionName).getOne(createResp.id);

    expect(resp.id).toBe(createResp.id);
  });

  it("deny user to view other users record", async () => {
    // throwaway record - first user gains an approved admin global permission
    await createUserRecord({ pb: userPb });

    const userData1 = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: userData1.email,
      password: userData1.password,
      passwordConfirm: userData1.password,
    });

    const userData2 = createUserEmailPasswordData();
    const createResp2 = await userPb.collection(usersCollectionName).create({
      email: userData2.email,
      password: userData2.password,
      passwordConfirm: userData2.password,
    });

    // log in as user1
    await userPb
      .collection(usersCollectionName)
      .authWithPassword(userData1.email, userData1.password);

    //attempt to get user2 record
    await expect(userPb.collection(usersCollectionName).getOne(createResp2.id)).rejects.toThrow();
  });

  it("deny logged out user to view any users record", async () => {
    // throwaway record - first user gains an approved admin global permission
    await createUserRecord({ pb: userPb });

    const userData1 = createUserEmailPasswordData();
    const createResp1 = await userPb.collection(usersCollectionName).create({
      email: userData1.email,
      password: userData1.password,
      passwordConfirm: userData1.password,
    });

    const userData2 = createUserEmailPasswordData();
    const createResp2 = await userPb.collection(usersCollectionName).create({
      email: userData2.email,
      password: userData2.password,
      passwordConfirm: userData2.password,
    });

    //attempt to get user1 record
    await expect(userPb.collection(usersCollectionName).getOne(createResp1.id)).rejects.toThrow();
    //attempt to get user2 record
    await expect(userPb.collection(usersCollectionName).getOne(createResp2.id)).rejects.toThrow();
  });
});

describe(`PocketBase user collection view rules as admin user`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("allow admin user to view user's record (inc. own)", async () => {
    const adminUserData = createUserEmailPasswordData();
    const adminUserRecord = await userPb.collection(usersCollectionName).create({
      email: adminUserData.email,
      password: adminUserData.password,
      passwordConfirm: adminUserData.password,
    });

    const userData1 = createUserEmailPasswordData();
    const userDataRecord1 = await userPb.collection(usersCollectionName).create({
      email: userData1.email,
      password: userData1.password,
      passwordConfirm: userData1.password,
    });

    const userData2 = createUserEmailPasswordData();
    const userDataRecord2 = await userPb.collection(usersCollectionName).create({
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

    //attempt to get user1 record
    const resp1 = await userPb.collection(usersCollectionName).getOne(userDataRecord1.id);
    expect(resp1.id).toBe(userDataRecord1.id);

    //attempt to get user2 record
    const resp2 = await userPb.collection(usersCollectionName).getOne(userDataRecord2.id);
    expect(resp2.id).toBe(userDataRecord2.id);
  });
});
