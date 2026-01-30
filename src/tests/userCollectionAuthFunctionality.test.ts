import { beforeEach, describe, expect, it } from "vitest";
import { userPb } from "../config/pocketbaseConfig";
import { usersCollectionName } from "./helpers/pocketbaseMetadata";
import { clearDatabase } from "./helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData } from "./helpers/pocketbaseUserHelpers";

describe(`PocketBase user collection view rules as standard user`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("deny log in: with non-existent user", async () => {
    await expect(
      userPb.collection(usersCollectionName).authWithPassword("test@example.com", "wrong-password"),
    ).rejects.toThrow();
  });

  it("deny log in: with incorrect creds", async () => {
    const userData1 = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: userData1.email,
      password: userData1.password,
      passwordConfirm: userData1.password,
    });

    await expect(
      userPb
        .collection(usersCollectionName)
        .authWithPassword(userData1.email, "incorrect-password"),
    ).rejects.toThrow();
  });

  it("allow log in: with correct creds", async () => {
    const userData1 = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: userData1.email,
      password: userData1.password,
      passwordConfirm: userData1.password,
    });

    await expect(
      userPb.collection(usersCollectionName).authWithPassword(userData1.email, userData1.password),
    ).resolves.not.toThrow();
  });
});
