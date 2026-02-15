import { beforeEach, describe, expect, it } from "vitest";
import { userPb } from "../../config/pocketbaseConfig";
import { createOrganisationRecordSeedData } from "../helpers/organisationsCollectionHelpers";
import { organisationUserPermissionSeedFactory } from "../helpers/organisationUserPermissionHelpers";
import {
  organisationsCollectionName,
  organisationUserPermissionsCollectionName,
  usersCollectionName,
} from "../helpers/pocketbaseMetadata";
import { clearDatabase } from "../helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData } from "../helpers/pocketbaseUserHelpers";

// createRule: @request.auth.id != "" && @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"
// Standard: @request.auth.id != "" && @request.auth.id = id
// Admin:    @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"

describe(`organisation user permissions collection update rules - unhappy paths`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it(`denied user to update an organisation user permission record if  user;
      - no orgUserPermission
  `, async () => {
    // first user gains an approved admin global permission
    const globalAndOrgAdminUserSeed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: globalAndOrgAdminUserSeed.email,
      password: globalAndOrgAdminUserSeed.password,
      passwordConfirm: globalAndOrgAdminUserSeed.password,
    });

    const user1Seed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: user1Seed.email,
      password: user1Seed.password,
      passwordConfirm: user1Seed.password,
    });
    const user2Seed = createUserEmailPasswordData();
    const user2Record = await userPb.collection(usersCollectionName).create({
      email: user2Seed.email,
      password: user2Seed.password,
      passwordConfirm: user2Seed.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(globalAndOrgAdminUserSeed.email, globalAndOrgAdminUserSeed.password);

    // creator user gains an approved admin organisation permission
    const organisationSeedData = createOrganisationRecordSeedData();
    const organisationRecord = await userPb
      .collection(organisationsCollectionName)
      .create(organisationSeedData);
    const orgUser2PermsCreatedRecord = await userPb
      .collection(organisationUserPermissionsCollectionName)
      .create(
        organisationUserPermissionSeedFactory.forCreate({
          userId: user2Record.id,
          organisationId: organisationRecord.id,
          role: "standard",
          status: "approved",
        }),
      );
    expect(orgUser2PermsCreatedRecord).toBeTruthy();

    userPb.authStore.clear();
    await userPb
      .collection(usersCollectionName)
      .authWithPassword(user1Seed.email, user1Seed.password);

    await expect(
      userPb
        .collection(organisationUserPermissionsCollectionName)
        .update(orgUser2PermsCreatedRecord.id, { role: "admin" }),
    ).rejects.toThrow();
  });

  it(`allows user to update an organisation user permission record if;
      - standard orgUserPermission
  `, async () => {
    // first user gains an approved admin global permission
    const globalAndOrgAdminUserSeed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: globalAndOrgAdminUserSeed.email,
      password: globalAndOrgAdminUserSeed.password,
      passwordConfirm: globalAndOrgAdminUserSeed.password,
    });

    const user1Seed = createUserEmailPasswordData();
    const user1Record = await userPb.collection(usersCollectionName).create({
      email: user1Seed.email,
      password: user1Seed.password,
      passwordConfirm: user1Seed.password,
    });
    const user2Seed = createUserEmailPasswordData();
    const user2Record = await userPb.collection(usersCollectionName).create({
      email: user2Seed.email,
      password: user2Seed.password,
      passwordConfirm: user2Seed.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(globalAndOrgAdminUserSeed.email, globalAndOrgAdminUserSeed.password);

    // creator user gains an approved admin organisation permission
    const organisationSeedData = createOrganisationRecordSeedData();
    const organisationRecord = await userPb
      .collection(organisationsCollectionName)
      .create(organisationSeedData);

    const orgUser2PermsCreatedRecord = await userPb
      .collection(organisationUserPermissionsCollectionName)
      .create(
        organisationUserPermissionSeedFactory.forCreate({
          userId: user2Record.id,
          organisationId: organisationRecord.id,
          role: "standard",
          status: "approved",
        }),
      );

    await userPb.collection(organisationUserPermissionsCollectionName).create(
      organisationUserPermissionSeedFactory.forCreate({
        userId: user1Record.id,
        organisationId: organisationRecord.id,
        role: "standard",
        status: "approved",
      }),
    );

    expect(orgUser2PermsCreatedRecord).toBeTruthy();

    userPb.authStore.clear();
    await userPb
      .collection(usersCollectionName)
      .authWithPassword(user1Seed.email, user1Seed.password);

    await expect(
      userPb
        .collection(organisationUserPermissionsCollectionName)
        .update(orgUser2PermsCreatedRecord.id, { role: "admin" }),
    ).rejects.toThrow();
  });
});

describe(`organisation user permissions collection update rules - happy path`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it(`allows user to update an organisation user permission record if;
      - admin orgUserPermission
  `, async () => {
    // first user gains an approved admin global permission
    const globalAndOrgAdminUserSeed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: globalAndOrgAdminUserSeed.email,
      password: globalAndOrgAdminUserSeed.password,
      passwordConfirm: globalAndOrgAdminUserSeed.password,
    });

    const user1Seed = createUserEmailPasswordData();
    const user1Record = await userPb.collection(usersCollectionName).create({
      email: user1Seed.email,
      password: user1Seed.password,
      passwordConfirm: user1Seed.password,
    });
    const user2Seed = createUserEmailPasswordData();
    const user2Record = await userPb.collection(usersCollectionName).create({
      email: user2Seed.email,
      password: user2Seed.password,
      passwordConfirm: user2Seed.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(globalAndOrgAdminUserSeed.email, globalAndOrgAdminUserSeed.password);

    // creator user gains an approved admin organisation permission
    const organisationSeedData = createOrganisationRecordSeedData();
    const organisationRecord = await userPb
      .collection(organisationsCollectionName)
      .create(organisationSeedData);

    const orgUser1PermsCreatedRecord = await userPb
      .collection(organisationUserPermissionsCollectionName)
      .create(
        organisationUserPermissionSeedFactory.forCreate({
          userId: user1Record.id,
          organisationId: organisationRecord.id,
          role: "standard",
          status: "approved",
        }),
      );
    const orgUser1PermsUpdatedRecord = await userPb
      .collection(organisationUserPermissionsCollectionName)
      .update(orgUser1PermsCreatedRecord.id, { role: "admin" });

    expect(orgUser1PermsUpdatedRecord).toBeTruthy();
    userPb.authStore.clear();
    await userPb
      .collection(usersCollectionName)
      .authWithPassword(user1Seed.email, user1Seed.password);

    const orgUser2PermsCreatedRecord = await userPb
      .collection(organisationUserPermissionsCollectionName)
      .create(
        organisationUserPermissionSeedFactory.forCreate({
          userId: user2Record.id,
          organisationId: organisationRecord.id,
          role: "standard",
          status: "approved",
        }),
      );
    expect(orgUser2PermsCreatedRecord).toBeTruthy();
    const orgUser2PermsUpdatedRecord = await userPb
      .collection(organisationUserPermissionsCollectionName)
      .update(orgUser2PermsCreatedRecord.id, {
        role: "admin",
      });
    expect(orgUser2PermsUpdatedRecord).toBeTruthy();
  });
});
