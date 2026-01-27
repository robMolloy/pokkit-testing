import { beforeEach, describe, expect, it } from "vitest";
import { userPb } from "../config/pocketbaseConfig";
import { clearDatabase } from "./helpers/pocketbaseTestHelpers";
import { usersCollectionName } from "./helpers/pocketbaseMetadata";
import { createUserEmailPasswordData, createUserRecord } from "./helpers/pocketbaseUserHelpers";

describe("PocketBase users collection rules", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("deny log in: user with invalid credentials", async () => {
    await expect(
      userPb.collection(usersCollectionName).authWithPassword("test@example.com", "wrong-password"),
    ).rejects.toThrow();
  });

  it("allow create:  user with valid email and password", async () => {
    // throwaway record - first user gains an approved admin global permission
    await createUserRecord({ pb: userPb });

    const userData = createUserEmailPasswordData();
    const resp = await userPb.collection(usersCollectionName).create({
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.password,
    });
    expect(resp.id).not.toBeNull();
  });

  it("deny read: user record when not authenticated; allow read: of own user record when authenticated; deny read: of other user records when authenticated", async () => {
    // throwaway record - first user gains an approved admin global permission
    await createUserRecord({ pb: userPb });

    const userData1 = createUserEmailPasswordData();
    const userRecord1 = await userPb.collection(usersCollectionName).create({
      email: userData1.email,
      password: userData1.password,
      passwordConfirm: userData1.password,
    });
    const userData2 = createUserEmailPasswordData();
    const userRecord2 = await userPb.collection(usersCollectionName).create({
      email: userData2.email,
      password: userData2.password,
      passwordConfirm: userData2.password,
    });

    // Verify unauthenticated access is denied
    await expect(userPb.collection(usersCollectionName).getOne(userRecord1.id)).rejects.toThrow();

    // Authenticate as user 1
    await userPb
      .collection(usersCollectionName)
      .authWithPassword(userData1.email, userData1.password);

    // Verify authenticated access is allowed
    const record = await userPb.collection(usersCollectionName).getOne(userRecord1.id);
    expect(record.id).toBe(userRecord1.id);

    // Verify authenticated access is denied for other user records
    await expect(userPb.collection(usersCollectionName).getOne(userRecord2.id)).rejects.toThrow();
  });

  it("allow list: standard user returns list with only own record when authenticated; allow list: when not authenticated list returns empty array", async () => {
    // throwaway record - first user gains an approved admin global permission
    await createUserRecord({ pb: userPb });

    const userData1 = createUserEmailPasswordData();
    const userRecord1 = await userPb.collection(usersCollectionName).create({
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

    // Verify unauthenticated access is denied
    const unauthRecords = await userPb.collection(usersCollectionName).getFullList();

    expect(unauthRecords.length).toBe(0);

    // Authenticate as user 1
    await userPb
      .collection(usersCollectionName)
      .authWithPassword(userData1.email, userData1.password);

    // Verify list returns only own record
    const records = await userPb.collection(usersCollectionName).getFullList();
    expect(records.length).toBe(1);
    expect(records[0].id).toBe(userRecord1.id);
  });
});
