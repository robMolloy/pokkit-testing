import type { ChildProcessWithoutNullStreams } from "child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PocketBase } from "../../config/pocketbaseConfig";
import { setupAndServeTestDb } from "../helpers/_helpers";
import { globalUserPermissionSeedFactory } from "../helpers/globalUserPermissionHelpers";
import { createOrganisationRecordSeedData } from "../helpers/organisationsCollectionHelpers";
import { organisationUserPermissionSeedFactory } from "../helpers/organisationUserPermissionHelpers";
import {
  globalUserPermissionsCollectionName,
  organisationsCollectionName,
  organisationUserPermissionsCollectionName,
  superusersCollectionName,
  usersCollectionName,
} from "../helpers/pocketbaseMetadata";
import { clearSpecifiedDatabase } from "../helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData } from "../helpers/pocketbaseUserHelpers";
import { parsedEnv } from "../helpers/testEnvHelpers";

// createRule: @request.auth.id != "" && @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"
// Standard: @request.auth.id != "" && @request.auth.id = id
// Admin:    @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"

const pocketbaseBuildFilePath = `pocketbase/app-db/builds/app-db`;
const testDirPath = `_temp/organisationsCollectionDeleteRules`;

const appDbUrl = "http://0.0.0.0:8090";
const appDbSuperuserEmail = "admin@admin.com";
const appDbSuperuserPassword = "admin@admin.com";
const testDbUrl = `http://0.0.0.0:8082`;
const testDbSuperuserEmail = "admin@admin.com";
const testDbSuperuserPassword = "admin@admin.com";

const createNewPbInstance = () => new PocketBase(testDbUrl);

let spawnProcess: ChildProcessWithoutNullStreams | undefined;

describe(`organisations delete rules for user with role of "standard" or "admin" in organisationUserPermissions`, () => {
  beforeAll(async () => {
    spawnProcess = await setupAndServeTestDb({
      spawnProcess,
      pocketbaseBuildFilePath,
      testDirPath,
      appDbUrl,
      appDbSuperuserEmail,
      appDbSuperuserPassword,
      testDbUrl,
      testDbSuperuserEmail,
      testDbSuperuserPassword,
    });
  });

  afterAll(async () => {
    await spawnProcess?.kill("SIGTERM");
    spawnProcess = undefined;
  });

  beforeEach(async () => {
    await clearSpecifiedDatabase({ testDbUrl, testDbSuperuserEmail, testDbSuperuserPassword });
  });

  it(`denies user to delete an organisation record, if:
      - no orgPermission record
      - admin global permission
    `, async () => {
    const superuserPb = createNewPbInstance();
    const userPb = createNewPbInstance();
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
    const superuserPb = createNewPbInstance();
    const userPb = createNewPbInstance();
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

  it(`allows user to delete an organisation record if;
    - admin orgPermission
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

    const resp = await userPb.collection(organisationsCollectionName).delete(organisationRecord.id);

    expect(resp).toBe(true);
  });
});
