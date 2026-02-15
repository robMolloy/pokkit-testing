import { beforeEach, describe, expect, it } from "vitest";
import { userPb } from "../../config/pocketbaseConfig";
import { createOrganisationRecordSeedData } from "../helpers/organisationsCollectionHelpers";
import { organisationsCollectionName, usersCollectionName } from "../helpers/pocketbaseMetadata";
import { clearDatabase } from "../helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData } from "../helpers/pocketbaseUserHelpers";

// createRule: @request.auth.id != "" && @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"
// Standard: @request.auth.id != "" && @request.auth.id = id
// Admin:    @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"

describe(`organisations collection view rules for logged out user`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it(`denies user to view an organisation record, if:
      - not logged in
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

    userPb.authStore.clear();

    await expect(
      userPb.collection(organisationsCollectionName).getOne(organisationRecord.id),
    ).rejects.toThrow();
  });
});

describe(`organisations collection view rules for logged in user`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it(`allows user to view an organisation record if;
    - logged in
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

    const resp = await userPb.collection(organisationsCollectionName).getOne(organisationRecord.id);

    expect(resp).toBeTruthy();
  });
});
