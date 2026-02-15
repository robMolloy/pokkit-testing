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
import { parsedEnv } from "../helpers/testEnvHelpers";

// createRule: @request.auth.id != "" && @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"
// Standard: @request.auth.id != "" && @request.auth.id = id
// Admin:    @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"

describe(`organisation user permissions collection view rules - unhappy paths`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it(`denies user to view an organisation user permission record if;
      - standard orgUserPermission
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

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(globalAndOrgAdminUserSeed.email, globalAndOrgAdminUserSeed.password);

    // creator user gains an approved admin organisation permission
    const organisationSeedData = createOrganisationRecordSeedData();
    await userPb.collection(organisationsCollectionName).create(organisationSeedData);

    const orgUserPermsRecords = await superuserPb
      .collection(organisationUserPermissionsCollectionName)
      .getFullList();
    const orgUserPermsRecord = orgUserPermsRecords[0];

    expect(orgUserPermsRecord).toBeTruthy();

    await superuserPb
      .collection(organisationUserPermissionsCollectionName)
      .update(orgUserPermsRecord.id, {
        role: "standard",
      });

    await expect(
      userPb.collection(organisationUserPermissionsCollectionName).getOne(orgUserPermsRecord.id),
    ).rejects.toThrow();
  });
  it(`denies user to view an organisation user permission record if;
      - no orgUserPermission record
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

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(globalAndOrgAdminUserSeed.email, globalAndOrgAdminUserSeed.password);

    // creator user gains an approved admin organisation permission
    const organisationSeedData = createOrganisationRecordSeedData();
    await userPb.collection(organisationsCollectionName).create(organisationSeedData);

    const orgUserPermsRecords = await superuserPb
      .collection(organisationUserPermissionsCollectionName)
      .getFullList();
    const orgUserPermsRecord = orgUserPermsRecords[0];

    expect(orgUserPermsRecord).toBeTruthy();

    await superuserPb
      .collection(organisationUserPermissionsCollectionName)
      .delete(orgUserPermsRecord.id);

    await expect(
      userPb.collection(organisationUserPermissionsCollectionName).getOne(orgUserPermsRecord.id),
    ).rejects.toThrow();
  });
});

describe(`organisation user permissions collection view rules - happy path`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it(`allows user to view an organisation user permission record if;
      - admin orgUserPermission
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

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(globalAndOrgAdminUserSeed.email, globalAndOrgAdminUserSeed.password);

    // creator user gains an approved admin organisation permission
    const organisationSeedData = createOrganisationRecordSeedData();
    await userPb.collection(organisationsCollectionName).create(organisationSeedData);

    const orgUserPermsRecords = await superuserPb
      .collection(organisationUserPermissionsCollectionName)
      .getFullList();
    const orgUserPermsRecord = orgUserPermsRecords[0];

    expect(orgUserPermsRecord).toBeTruthy();

    const resp = await userPb
      .collection(organisationUserPermissionsCollectionName)
      .getOne(orgUserPermsRecord.id);

    expect(resp).toBeTruthy();
  });
});
