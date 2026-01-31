import { beforeEach, describe, expect, it } from "vitest";
import { userPb } from "../config/pocketbaseConfig";
import { usersCollectionName } from "./helpers/pocketbaseMetadata";
import { clearDatabase } from "./helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData, createUserRecord } from "./helpers/pocketbaseUserHelpers";

// id = @request.auth.id

describe(`PocketBase user collection delete rules as user`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("allows user to delete own record", async () => {
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

    // Attempt to delete other user's record should fail
    await expect(userPb.collection(usersCollectionName).delete(userRecord2.id)).rejects.toThrow();
  });
});
