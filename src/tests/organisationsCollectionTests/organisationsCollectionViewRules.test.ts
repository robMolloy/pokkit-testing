import type { ChildProcessWithoutNullStreams } from "child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PocketBase } from "../../config/pocketbaseConfig";
import { setupAndServeTestDbFromRunningInstanceWithDefaults } from "../helpers/_helpers";
import { createOrganisationRecordSeedData } from "../helpers/organisationsCollectionHelpers";
import { organisationsCollectionName, usersCollectionName } from "../helpers/pocketbaseMetadata";
import { clearDatabase } from "../helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData } from "../helpers/pocketbaseUserHelpers";
import fse from "fs-extra";

// createRule: @request.auth.id != "" && @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"
// Standard: @request.auth.id != "" && @request.auth.id = id
// Admin:    @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"

const testDirPath = `_temp/organisationsCollectionViewRules`;
const testDbUrl = `http://0.0.0.0:8085`;
const testDbSuperuserEmail = "admin@admin.com";
const testDbSuperuserPassword = "admin@admin.com";

const createNewPbInstance = () => new PocketBase(testDbUrl);

let spawnProcess: ChildProcessWithoutNullStreams | undefined;

describe(`organisations collection view rules for logged out user`, () => {
  beforeAll(async () => {
    await spawnProcess?.kill("SIGTERM");
    spawnProcess = await setupAndServeTestDbFromRunningInstanceWithDefaults({
      testDirPath,
      testDbUrl,
    });
  });

  afterAll(async () => {
    await spawnProcess?.kill("SIGTERM");
    spawnProcess = undefined;
    fse.removeSync(testDirPath);
  });

  beforeEach(async () => {
    await clearDatabase({
      dbUrl: testDbUrl,
      dbSuperuserEmail: testDbSuperuserEmail,
      dbSuperuserPassword: testDbSuperuserPassword,
    });
  });

  it(`denies user to view an organisation record, if:
      - not logged in
    `, async () => {
    const userPb = createNewPbInstance();
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

  it(`allows user to view an organisation record if;
    - logged in
`, async () => {
    const userPb = createNewPbInstance(); /*  */
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
