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
import fse from "fs-extra";

// createRule: @request.auth.id != "" && @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"
// Standard: @request.auth.id != "" && @request.auth.id = id
// Admin:    @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"

const pocketbaseBuildFilePath = `pocketbase/app-db/builds/app-db`;
const testDirPath = `_temp/organisationsUserPermissionsCollectionListRules`;

const appDbUrl = "http://0.0.0.0:8090";
const appDbSuperuserEmail = "admin@admin.com";
const appDbSuperuserPassword = "admin@admin.com";
const testDbUrl = `http://0.0.0.0:8093`;
const testDbSuperuserEmail = "admin@admin.com";
const testDbSuperuserPassword = "admin@admin.com";

const createNewPbInstance = () => new PocketBase(testDbUrl);

let spawnProcess: ChildProcessWithoutNullStreams | undefined;

describe(`organisation user permissions collection list rules - unhappy and happy paths`, () => {
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
    fse.removeSync(testDirPath);
  });

  beforeEach(async () => {
    await clearDatabase({
      dbUrl: testDbUrl,
      dbSuperuserEmail: testDbSuperuserEmail,
      dbSuperuserPassword: testDbSuperuserPassword,
    });
  });

  it(`denies user to list an organisation user permission record if;
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

    const resp = await userPb.collection(organisationUserPermissionsCollectionName).getFullList();
    expect(resp.length).toBe(0);
  });

  it(`denies user to list an organisation user permission record if;
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

    const resp = await userPb.collection(organisationUserPermissionsCollectionName).getFullList();
    expect(resp.length).toBe(0);
  });

  it(`allows user to list an organisation user permission record if;
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

    const resp = await userPb.collection(organisationUserPermissionsCollectionName).getFullList();

    expect(resp.length).toBe(1);
  });
});
