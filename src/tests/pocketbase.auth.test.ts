import { describe, expect, it, beforeEach } from "vitest";
import { testPb } from "../config/pocketbaseConfig";
import {
  clearDatabase,
  createUserEmailPassword,
  createUserEmailPasswordData,
} from "./helpers/pocketbaseTestHelpers";

const usersCollectionName = "users";

describe("PocketBase users collection rules", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("deny log in: user with invalid credentials", async () => {
    await expect(
      testPb.collection("users").authWithPassword("test@example.com", "wrong-password"),
    ).rejects.toThrow();
  });

  it("allow create: user with valid email and password", async () => {
    const { email, password } = createUserEmailPasswordData();
    const resp = await createUserEmailPassword(email, password);
    expect(resp.id).not.toBeNull();
  });

  it("deny read: user record when not authenticated; allow read: user record when authenticated", async () => {
    const { email, password } = createUserEmailPasswordData();
    const createdUser = await createUserEmailPassword(email, password);

    // Verify unauthenticated access is denied
    await expect(testPb.collection(usersCollectionName).getOne(createdUser.id)).rejects.toThrow();

    // Verify authenticated access is allowed
    await testPb.collection(usersCollectionName).authWithPassword(email, password);
    const record = await testPb.collection(usersCollectionName).getOne(createdUser.id);
    expect(record.id).toBe(createdUser.id);
  });
});
