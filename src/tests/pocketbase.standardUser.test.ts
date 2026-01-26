import { beforeEach, describe, expect, it } from "vitest";
import { testPb } from "../config/pocketbaseConfig";
import { clearDatabase } from "./helpers/pocketbaseTestHelpers";
import { usersCollectionName } from "./helpers/pocketbaseMetadata";
import { createUserEmailPasswordData, createUserRecord } from "./helpers/pocketbaseUserHelpers";

describe("PocketBase users collection rules", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("deny log in: user with invalid credentials", async () => {
    await expect(
      testPb.collection(usersCollectionName).authWithPassword("test@example.com", "wrong-password"),
    ).rejects.toThrow();
  });

  it("allow create: user with valid email and password", async () => {
    // throwaway record - first user gains an approved admin global permission
    await createUserRecord({ pb: testPb });

    const userData = createUserEmailPasswordData();
    const resp = await testPb.collection(usersCollectionName).create({
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.password,
    });
    expect(resp.id).not.toBeNull();
  });

  it("deny read: user record when not authenticated; allow read: of own user record when authenticated; deny read: of other user records when authenticated", async () => {
    // throwaway record - first user gains an approved admin global permission
    await createUserRecord({ pb: testPb });

    const userData1 = createUserEmailPasswordData();
    const userRecord1 = await testPb.collection(usersCollectionName).create({
      email: userData1.email,
      password: userData1.password,
      passwordConfirm: userData1.password,
    });
    const userData2 = createUserEmailPasswordData();
    const userRecord2 = await testPb.collection(usersCollectionName).create({
      email: userData2.email,
      password: userData2.password,
      passwordConfirm: userData2.password,
    });

    // Verify unauthenticated access is denied
    await expect(testPb.collection(usersCollectionName).getOne(userRecord1.id)).rejects.toThrow();

    // Authenticate as user 1
    await testPb
      .collection(usersCollectionName)
      .authWithPassword(userData1.email, userData1.password);

    // Verify authenticated access is allowed
    const record = await testPb.collection(usersCollectionName).getOne(userRecord1.id);
    expect(record.id).toBe(userRecord1.id);

    // Verify authenticated access is denied for other user records
    await expect(testPb.collection(usersCollectionName).getOne(userRecord2.id)).rejects.toThrow();
  });
});
