import { beforeEach, describe, expect, it } from "vitest";
import { userPb } from "../config/pocketbaseConfig";
import {
  globalUserPermissionsCollectionName,
  usersCollectionName,
} from "./helpers/pocketbaseMetadata";
import { clearDatabase } from "./helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData, createUserRecord } from "./helpers/pocketbaseUserHelpers";

// id = @request.auth.id

describe(`PocketBase user collection update rules as user`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("allows user to update own record", async () => {
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
