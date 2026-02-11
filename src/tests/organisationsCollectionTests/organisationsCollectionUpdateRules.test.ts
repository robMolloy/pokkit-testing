import { beforeEach, describe, expect, it } from "vitest";
import { userPb } from "../../config/pocketbaseConfig";
import { createOrganisationRecordSeedData } from "../helpers/organisationsCollectionHelpers";
import { organisationsCollectionName, usersCollectionName } from "../helpers/pocketbaseMetadata";
import { clearDatabase } from "../helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData } from "../helpers/pocketbaseUserHelpers";

// createRule: @request.auth.id != "" && @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"
// Standard: @request.auth.id != "" && @request.auth.id = id
// Admin:    @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"

// describe(`PocketBase organisations collection update rules as standard user`, () => {
//   beforeEach(async () => {
//     await clearDatabase();
//   });

//   it.skip("denies standard user to update an organisation record for an existing user if the user has a non admin globalPermissionRecord", async () => {
//     // throwaway record - first user gains an approved admin global permission
//     await createUserRecord({ pb: userPb });

//     // first user gains an approved admin global permission
//     const user1Seed = createUserEmailPasswordData();
//     const user1Record = await userPb.collection(usersCollectionName).create({
//       email: user1Seed.email,
//       password: user1Seed.password,
//       passwordConfirm: user1Seed.password,
//     });

//     await superuserPb
//       .collection(superusersCollectionName)
//       .authWithPassword("admin@admin.com", "admin@admin.com");

//     await superuserPb.collection(globalUserPermissionsCollectionName).create({
//       id: user1Record.id,
//       userId: user1Record.id,
//       ...createGlobalUserPermissionRecordSeedData(),
//     });

//     await userPb
//       .collection(usersCollectionName)
//       .authWithPassword(user1Seed.email, user1Seed.password);

//     const organisationSeedData = createOrganisationRecordSeedData();
//     await expect(
//       userPb.collection(organisationsCollectionName).create(organisationSeedData),
//     ).rejects.toThrow();
//   });

//   it.skip("denies standard user to create a globalUserPermissions record for an existing user if the user is missing a globalPermission record", async () => {
//     // throwaway record - first user gains an approved admin global permission
//     await createUserRecord({ pb: userPb });

//     // first user gains an approved admin global permission
//     const user1Seed = createUserEmailPasswordData();
//     await userPb.collection(usersCollectionName).create({
//       email: user1Seed.email,
//       password: user1Seed.password,
//       passwordConfirm: user1Seed.password,
//     });

//     await userPb
//       .collection(usersCollectionName)
//       .authWithPassword(user1Seed.email, user1Seed.password);

//     const organisationSeedData = createOrganisationRecordSeedData();
//     await expect(
//       userPb.collection(organisationsCollectionName).create(organisationSeedData),
//     ).rejects.toThrow();
//   });
// });

describe(`PocketBase organisations collection update rules as admin user`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("allows admin user to update an organisation record", async () => {
    // first user gains an approved admin global permission
    const adminUserSeed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: adminUserSeed.email,
      password: adminUserSeed.password,
      passwordConfirm: adminUserSeed.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(adminUserSeed.email, adminUserSeed.password);

    // creator user gains an approved admin organisation permission
    const organisationSeedData = createOrganisationRecordSeedData();
    const organisationRecord = await userPb
      .collection(organisationsCollectionName)
      .create(organisationSeedData);

    const updatedOrganisationRecord = await userPb
      .collection(organisationsCollectionName)
      .update(organisationRecord.id, { name: "Updated Organisation Name" });

    expect(updatedOrganisationRecord.name).toBe("Updated Organisation Name");
  });
});
