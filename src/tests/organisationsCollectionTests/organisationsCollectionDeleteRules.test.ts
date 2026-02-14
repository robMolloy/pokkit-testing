import { beforeEach, describe, expect, it } from "vitest";
import { superuserPb, userPb } from "../../config/pocketbaseConfig";
import { createOrganisationRecordSeedData } from "../helpers/organisationsCollectionHelpers";
import {
  globalUserPermissionsCollectionName,
  organisationsCollectionName,
  organisationUserPermissionsCollectionName,
  superusersCollectionName,
  usersCollectionName,
} from "../helpers/pocketbaseMetadata";
import { clearDatabase } from "../helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData } from "../helpers/pocketbaseUserHelpers";
import { parsedEnv } from "../helpers/testEnvHelpers";
import { globalUserPermissionSeedFactory } from "../helpers/globalUserPermissionHelpers";
import { organisationUserPermissionSeedFactory } from "../helpers/organisationUserPermissionHelpers";

// createRule: @request.auth.id != "" && @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"
// Standard: @request.auth.id != "" && @request.auth.id = id
// Admin:    @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"

describe(`organisations delete rules for user with role of "standard" in organisationUserPermissions`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it(`denies user to delete an organisation record, if:
      - no orgPermission record
      - admin global permission
    `, async () => {
    await superuserPb
      .collection(superusersCollectionName)
      .authWithPassword(parsedEnv.TEST_DB_USERNAME, parsedEnv.TEST_DB_PASSWORD);

    // first user gains an approved admin global permission
    const globalAndOrgAdminUserSeed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: globalAndOrgAdminUserSeed.email,
      password: globalAndOrgAdminUserSeed.password,
      passwordConfirm: globalAndOrgAdminUserSeed.password,
    });

    const globalAdminUserSeed = createUserEmailPasswordData();
    const globalAdminUserRecord = await userPb.collection(usersCollectionName).create({
      email: globalAdminUserSeed.email,
      password: globalAdminUserSeed.password,
      passwordConfirm: globalAdminUserSeed.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(globalAndOrgAdminUserSeed.email, globalAndOrgAdminUserSeed.password);

    // creator user gains an approved admin organisation permission
    const organisationSeedData = createOrganisationRecordSeedData();
    const organisationRecord = await userPb
      .collection(organisationsCollectionName)
      .create(organisationSeedData);

    userPb.authStore.clear();

    await superuserPb.collection(globalUserPermissionsCollectionName).create(
      globalUserPermissionSeedFactory.forCreate({
        userId: globalAdminUserRecord.id,
        role: "standard",
        status: "approved",
      }),
    );
    await userPb
      .collection(usersCollectionName)
      .authWithPassword(globalAdminUserSeed.email, globalAdminUserSeed.password);

    await expect(
      userPb.collection(organisationsCollectionName).delete(organisationRecord.id),
    ).rejects.toThrow();
  });

  it(`denies user to delete an organisation record, if:
      - standard orgPermission
      - admin global permission
    `, async () => {
    await superuserPb
      .collection(superusersCollectionName)
      .authWithPassword(parsedEnv.TEST_DB_USERNAME, parsedEnv.TEST_DB_PASSWORD);

    // first user gains an approved admin global permission
    const globalAndOrgAdminUserSeed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: globalAndOrgAdminUserSeed.email,
      password: globalAndOrgAdminUserSeed.password,
      passwordConfirm: globalAndOrgAdminUserSeed.password,
    });

    const globalAdminUserSeed = createUserEmailPasswordData();
    const globalAdminUserRecord = await userPb.collection(usersCollectionName).create({
      email: globalAdminUserSeed.email,
      password: globalAdminUserSeed.password,
      passwordConfirm: globalAdminUserSeed.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(globalAndOrgAdminUserSeed.email, globalAndOrgAdminUserSeed.password);

    // creator user gains an approved admin organisation permission
    const organisationSeedData = createOrganisationRecordSeedData();
    const organisationRecord = await userPb
      .collection(organisationsCollectionName)
      .create(organisationSeedData);

    userPb.authStore.clear();

    await superuserPb.collection(globalUserPermissionsCollectionName).create(
      globalUserPermissionSeedFactory.forCreate({
        userId: globalAdminUserRecord.id,
        role: "standard",
        status: "approved",
      }),
    );

    await superuserPb.collection(organisationUserPermissionsCollectionName).create(
      organisationUserPermissionSeedFactory.forCreate({
        userId: globalAdminUserRecord.id,
        organisationId: organisationRecord.id,
        role: "standard",
        status: "approved",
      }),
    );
    await userPb
      .collection(usersCollectionName)
      .authWithPassword(globalAdminUserSeed.email, globalAdminUserSeed.password);

    await expect(
      userPb.collection(organisationsCollectionName).delete(organisationRecord.id),
    ).rejects.toThrow();
  });
});

describe(`PocketBase organisations collection delete rules as orgadmin user`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it(`allows user to delete an organisation record if;
    - admin orgPermission
`, async () => {
    // first user gains an approved admin global permission
    const globalAndOrgAdminUserSeed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: globalAndOrgAdminUserSeed.email,
      password: globalAndOrgAdminUserSeed.password,
      passwordConfirm: globalAndOrgAdminUserSeed.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(globalAndOrgAdminUserSeed.email, globalAndOrgAdminUserSeed.password);

    // creator user gains an approved admin organisation permission
    const organisationSeedData = createOrganisationRecordSeedData();
    const organisationRecord = await userPb
      .collection(organisationsCollectionName)
      .create(organisationSeedData);

    const resp = await userPb.collection(organisationsCollectionName).delete(organisationRecord.id);

    expect(resp).toBe(true);
  });
});
