import { beforeEach, describe, expect, it } from "vitest";
import { clearDatabase, createUserEmailPasswordData } from "./helpers/pocketbaseTestHelpers";
import { testPb } from "../config/pocketbaseConfig";
import {
  globalUserPermissionsCollectionName,
  usersCollectionName,
} from "./helpers/pocketbaseMetadata";

describe("PocketBase users collection global permissions", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it.only("allow create: user when providing a valid email and password", async () => {
    const { email, password } = createUserEmailPasswordData();
    const createdUser = await testPb.collection(usersCollectionName).create({
      email,
      password,
      passwordConfirm: password,
    });

    await testPb.collection(usersCollectionName).authWithPassword(email, password);

    expect(createdUser.id).not.toBeNull();

    const createdGlobalUserPermissionsRecord = await testPb
      .collection(globalUserPermissionsCollectionName)
      .getOne(createdUser.id);

    expect(createdGlobalUserPermissionsRecord.id).toBe(createdUser.id);
    expect(createdGlobalUserPermissionsRecord.role).toBe("admin");
    expect(createdGlobalUserPermissionsRecord.status).toBe("approved");

    testPb.authStore.clear();

    await expect(
      testPb.collection(globalUserPermissionsCollectionName).getOne(createdUser.id),
    ).rejects.toThrow();
  });
});
