import { beforeEach, describe, expect, it } from "vitest";
import { clearDatabase } from "./helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData, createUserRecord } from "./helpers/pocketbaseUserHelpers";
import { superuserPb, userPb } from "../config/pocketbaseConfig";
import {
  globalUserPermissionsCollectionName,
  superusersCollectionName,
  usersCollectionName,
} from "./helpers/pocketbaseMetadata";

describe("PocketBase admin users collection rules", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("allow create: the first user created receives approved admin global permission", async () => {
    const userData1 = createUserEmailPasswordData();
    const userRecord1 = await userPb.collection(usersCollectionName).create({
      email: userData1.email,
      password: userData1.password,
      passwordConfirm: userData1.password,
    });
    await createUserRecord({ pb: userPb }); // throwaway record
    await createUserRecord({ pb: userPb }); // throwaway record
    await createUserRecord({ pb: userPb }); // throwaway record

    expect(userRecord1.id).not.toBeNull();

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(userData1.email, userData1.password);

    await superuserPb
      .collection(superusersCollectionName)
      .authWithPassword("admin@admin.com", "admin@admin.com");

    const createdGlobalUserPermissionsRecord = await superuserPb
      .collection(globalUserPermissionsCollectionName)
      .getOne(userRecord1.id);

    expect(createdGlobalUserPermissionsRecord.id).toBe(userRecord1.id);
    expect(createdGlobalUserPermissionsRecord.role).toBe("admin");
    expect(createdGlobalUserPermissionsRecord.status).toBe("approved");

    const users = await userPb.collection(usersCollectionName).getFullList();
    expect(users.length).toBe(4);

    const notOwnUsers = users.filter((u) => u.id !== userRecord1.id);

    for (const user of notOwnUsers) {
      const userRecord = await userPb.collection(usersCollectionName).getOne(user.id);
      expect(userRecord.id).toBe(user.id);
    }
  });
});
