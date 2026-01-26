import { beforeEach, describe, expect, it } from "vitest";
import { clearDatabase } from "./helpers/pocketbaseTestHelpers";
import { testPb } from "../config/pocketbaseConfig";
import {
  globalUserPermissionsCollectionName,
  usersCollectionName,
} from "./helpers/pocketbaseMetadata";
import { createUserEmailPasswordData } from "./helpers/pocketbaseUserHelpers";

describe("PocketBase users collection global permissions", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it.only("allow create and read: first user receives approved admin global permission", async () => {
    const { email, password } = createUserEmailPasswordData();
    const userRecord = await testPb.collection(usersCollectionName).create({
      email,
      password,
      passwordConfirm: password,
    });

    await testPb.collection(usersCollectionName).authWithPassword(email, password);

    expect(userRecord.id).not.toBeNull();

    const createdGlobalUserPermissionsRecord = await testPb
      .collection(globalUserPermissionsCollectionName)
      .getOne(userRecord.id);

    expect(createdGlobalUserPermissionsRecord.id).toBe(userRecord.id);
    expect(createdGlobalUserPermissionsRecord.role).toBe("admin");
    expect(createdGlobalUserPermissionsRecord.status).toBe("approved");

    testPb.authStore.clear();

    await expect(
      testPb.collection(globalUserPermissionsCollectionName).getOne(userRecord.id),
    ).rejects.toThrow();
  });
});
