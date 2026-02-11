import { beforeEach, describe, expect, it } from "vitest";
import { superuserPb, userPb } from "../../config/pocketbaseConfig";
import { createOrganisationRecordSeedData } from "../helpers/organisationsCollectionHelpers";
import {
  organisationsCollectionName,
  organisationUserPermissionsCollectionName,
  superusersCollectionName,
  usersCollectionName,
} from "../helpers/pocketbaseMetadata";
import { clearDatabase } from "../helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData } from "../helpers/pocketbaseUserHelpers";
import { organisationUserPermissionSeedFactory } from "../helpers/organisationUserPermissionHelpers";

// createRule: @request.auth.id != "" && @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"
// Standard: @request.auth.id != "" && @request.auth.id = id
// Admin:    @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"

describe(`organisations update rules for user with role of "standard" in organisationUserPermissions`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("denies user with standard orgPermission to update an organisation record", async () => {
    // first user gains an approved admin global permission
    const adminUserSeed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: adminUserSeed.email,
      password: adminUserSeed.password,
      passwordConfirm: adminUserSeed.password,
    });

    const user1Seed = createUserEmailPasswordData();
    const user1Record = await userPb.collection(usersCollectionName).create({
      email: user1Seed.email,
      password: user1Seed.password,
      passwordConfirm: user1Seed.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(adminUserSeed.email, adminUserSeed.password);
    // creator user gains an approved admin organisation permission
    const organisationSeedData = createOrganisationRecordSeedData();
    const organisationRecord = await userPb
      .collection(organisationsCollectionName)
      .create(organisationSeedData);

    userPb.authStore.clear();

    await superuserPb
      .collection(superusersCollectionName)
      .authWithPassword("admin@admin.com", "admin@admin.com");

    const userId = user1Record.id;
    const organisationId = organisationRecord.id;

    const organisationUserPermissionSeed = organisationUserPermissionSeedFactory.forCreate({
      userId,
      organisationId,
      role: "standard",
      status: "approved",
    });

    await superuserPb
      .collection(organisationUserPermissionsCollectionName)
      .create(organisationUserPermissionSeed);

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(user1Seed.email, user1Seed.password);

    await expect(
      userPb
        .collection(organisationsCollectionName)
        .update(organisationRecord.id, { name: "Updated Organisation Name" }),
    ).rejects.toThrow();
  });

  it("denies user with no orgPermission to update an organisation record", async () => {
    // first user gains an approved admin global permission
    const adminUserSeed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: adminUserSeed.email,
      password: adminUserSeed.password,
      passwordConfirm: adminUserSeed.password,
    });

    const user1Seed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: user1Seed.email,
      password: user1Seed.password,
      passwordConfirm: user1Seed.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(adminUserSeed.email, adminUserSeed.password);
    // creator user gains an approved admin organisation permission
    const organisationSeedData = createOrganisationRecordSeedData();
    const organisationRecord = await userPb
      .collection(organisationsCollectionName)
      .create(organisationSeedData);

    userPb.authStore.clear();

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(user1Seed.email, user1Seed.password);

    await expect(
      userPb
        .collection(organisationsCollectionName)
        .update(organisationRecord.id, { name: "Updated Organisation Name" }),
    ).rejects.toThrow();
  });
});

describe(`PocketBase organisations collection update rules as admin user`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("allows organisation admin orgPermission user to update an organisation record", async () => {
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
