import { beforeEach, describe, expect, it } from "vitest";
import { clearDatabase } from "./helpers/pocketbaseTestHelpers";
import { userPb } from "../config/pocketbaseConfig";
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
    const userRecord = await userPb.collection(usersCollectionName).create({
      email,
      password,
      passwordConfirm: password,
    });

    await userPb.collection(usersCollectionName).authWithPassword(email, password);

    expect(userRecord.id).not.toBeNull();

    const createdGlobalUserPermissionsRecord = await userPb
      .collection(globalUserPermissionsCollectionName)
      .getOne(userRecord.id);

    expect(createdGlobalUserPermissionsRecord.id).toBe(userRecord.id);
    expect(createdGlobalUserPermissionsRecord.role).toBe("admin");
    expect(createdGlobalUserPermissionsRecord.status).toBe("approved");

    userPb.authStore.clear();

    await expect(
      userPb.collection(globalUserPermissionsCollectionName).getOne(userRecord.id),
    ).rejects.toThrow();
  });
});
