import type { ChildProcessWithoutNullStreams } from "child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PocketBase } from "../../config/pocketbaseConfig";
import { setupAndServeTestDb } from "../helpers/_helpers";
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

const pocketbaseBuildFilePath = `pocketbase/app-db/builds/app-db`;
const testDirPath = `_temp/organisationsUserPermissionsCollectionViewRules`;

const appDbUrl = "http://0.0.0.0:8090";
const appDbSuperuserEmail = "admin@admin.com";
const appDbSuperuserPassword = "admin@admin.com";
const testDbUrl = `http://0.0.0.0:8095`;
const testDbSuperuserEmail = "admin@admin.com";
const testDbSuperuserPassword = "admin@admin.com";

const createNewPbInstance = () => new PocketBase(testDbUrl);

let spawnProcess: ChildProcessWithoutNullStreams | undefined;

describe(`organisation user permissions collection view rules - unhappy paths`, () => {
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
    await clearDatabase({
      dbUrl: testDbUrl,
      dbSuperuserEmail: testDbSuperuserEmail,
      dbSuperuserPassword: testDbSuperuserPassword,
    });
  });

  it(`denies user to view an organisation user permission record if;
      - standard orgUserPermission
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
    if (!orgUserPermsRecord) throw new Error("Expected orgUserPermsRecord to have an id");

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
    if (!orgUserPermsRecord) throw new Error("Expected orgUserPermsRecord to have an id");

    await superuserPb
      .collection(organisationUserPermissionsCollectionName)
      .delete(orgUserPermsRecord.id);

    await expect(
      userPb.collection(organisationUserPermissionsCollectionName).getOne(orgUserPermsRecord.id),
    ).rejects.toThrow();
  });

  it(`allows user to view an organisation user permission record if;
      - admin orgUserPermission
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
    if (!orgUserPermsRecord) throw new Error("Expected orgUserPermsRecord to have an id");

    const resp = await userPb
      .collection(organisationUserPermissionsCollectionName)
      .getOne(orgUserPermsRecord.id);

    expect(resp).toBeTruthy();
  });
});
