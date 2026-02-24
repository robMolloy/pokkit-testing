import type { ChildProcessWithoutNullStreams } from "child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PocketBase } from "../../config/pocketbaseConfig";
import { setupAndServeTestDb } from "../helpers/_helpers";
import { organisationSeedFactory } from "../helpers/organisationsCollectionHelpers";
import { organisationUserPermissionSeedFactory } from "../helpers/organisationUserPermissionHelpers";
import {
  organisationsCollectionName,
  organisationUserPermissionsCollectionName,
  superusersCollectionName,
  usersCollectionName,
} from "../helpers/pocketbaseMetadata";
import { clearDatabase } from "../helpers/pocketbaseTestHelpers";
import { userSeedFactory } from "../helpers/pocketbaseUserHelpers";
import { parsedEnv } from "../helpers/testEnvHelpers";

// deleteRule: @request.auth.id != "" && @collection.organisationUserPermissions.userId ?= @request.auth.id && @collection.organisationUserPermissions.organisationId ?= organisationId && @collection.organisationUserPermissions.role ?= "admin" && @collection.organisationUserPermissions.status ?= "approved"

const pocketbaseBuildFilePath = `pocketbase/app-db/builds/app-db`;
const testDirPath = `_temp/organisationsUserPermissionsCollectionDeleteRules`;

const appDbUrl = "http://0.0.0.0:8090";
const appDbSuperuserEmail = "admin@admin.com";
const appDbSuperuserPassword = "admin@admin.com";
const testDbUrl = `http://0.0.0.0:8092`;
const testDbSuperuserEmail = "admin@admin.com";
const testDbSuperuserPassword = "admin@admin.com";

const createNewPbInstance = () => new PocketBase(testDbUrl);

let spawnProcess: ChildProcessWithoutNullStreams | undefined;

const setupOrgUserPermissionRecordForDeleteTests = async () => {
  // first user gains an approved admin global permission
  const globalAndOrgAdminUserPb = createNewPbInstance();
  const globalAndOrgAdminUserSeed = userSeedFactory.forCreateFilledIn();
  // global and org admin user record created
  const globalAndOrgAdminUserRecord = await globalAndOrgAdminUserPb
    .collection(usersCollectionName)
    .create({
      email: globalAndOrgAdminUserSeed.email,
      password: globalAndOrgAdminUserSeed.password,
      passwordConfirm: globalAndOrgAdminUserSeed.password,
    });
  // global and org admin user logged in
  await globalAndOrgAdminUserPb
    .collection(usersCollectionName)
    .authWithPassword(globalAndOrgAdminUserSeed.email, globalAndOrgAdminUserSeed.password);

  // create an organisation record
  // creator user gains an approved admin organisation permission
  const organisationRecord = await globalAndOrgAdminUserPb
    .collection(organisationsCollectionName)
    .create(organisationSeedFactory.forCreateFilledIn());

  const orgAdminUserPb = createNewPbInstance();
  const orgAdminUserSeed = userSeedFactory.forCreateFilledIn();
  const orgAdminUserRecord = await orgAdminUserPb.collection(usersCollectionName).create({
    email: orgAdminUserSeed.email,
    password: orgAdminUserSeed.password,
    passwordConfirm: orgAdminUserSeed.password,
  });
  orgAdminUserPb
    .collection(usersCollectionName)
    .authWithPassword(orgAdminUserSeed.email, orgAdminUserSeed.password);

  const orgAdminUserPermissionsRecord = await globalAndOrgAdminUserPb
    .collection(organisationUserPermissionsCollectionName)
    .create(
      organisationUserPermissionSeedFactory.forCreate({
        userId: orgAdminUserRecord.id,
        organisationId: organisationRecord.id,
        role: "admin",
        status: "approved",
      }),
    );

  const orgStandardUserPb = createNewPbInstance();
  const orgStandardUserSeed = userSeedFactory.forCreateFilledIn();
  const orgStandardUserRecord = await orgStandardUserPb.collection(usersCollectionName).create({
    email: orgStandardUserSeed.email,
    password: orgStandardUserSeed.password,
    passwordConfirm: orgStandardUserSeed.password,
  });
  orgStandardUserPb
    .collection(usersCollectionName)
    .authWithPassword(orgStandardUserSeed.email, orgStandardUserSeed.password);

  const orgStandardUserPermissionsRecord = await globalAndOrgAdminUserPb
    .collection(organisationUserPermissionsCollectionName)
    .create(
      organisationUserPermissionSeedFactory.forCreate({
        userId: orgStandardUserRecord.id,
        organisationId: organisationRecord.id,
        role: "standard",
        status: "approved",
      }),
    );

  const superuserPb = createNewPbInstance();
  await superuserPb
    .collection(superusersCollectionName)
    .authWithPassword(parsedEnv.TEST_DB_USERNAME, parsedEnv.TEST_DB_PASSWORD);

  return {
    globalAndOrgAdminUserPb,
    globalAndOrgAdminUserPlainTextRecord: {
      ...globalAndOrgAdminUserRecord,
      ...globalAndOrgAdminUserSeed,
    },
    orgAdminUserPb,
    orgAdminUserPlainTextRecord: { ...orgAdminUserRecord, ...orgAdminUserSeed },
    orgAdminUserPermissionsRecord,

    orgStandardUserPb,
    orgStandardUserPlainTextRecord: { ...orgStandardUserRecord, ...orgStandardUserSeed },
    orgStandardUserPermissionsRecord,

    superuserPb,
  };
};

describe(`organisation user permissions collection update rules - unhappy and happy paths`, () => {
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

  it(`denied user to update an organisation user permission record if  user;
      - no orgUserPermission
  `, async () => {
    const {
      orgAdminUserPermissionsRecord,
      orgStandardUserPermissionsRecord,
      orgStandardUserPb,
      superuserPb,
    } = await setupOrgUserPermissionRecordForDeleteTests();

    await superuserPb
      .collection(superusersCollectionName)
      .authWithPassword(parsedEnv.TEST_DB_USERNAME, parsedEnv.TEST_DB_PASSWORD);

    // delete org standard user permissions record with superuser
    await superuserPb
      .collection(organisationUserPermissionsCollectionName)
      .delete(orgStandardUserPermissionsRecord.id);

    // delete org admin user permissions record with user that has no org permissions
    await expect(
      orgStandardUserPb
        .collection(organisationUserPermissionsCollectionName)
        .delete(orgAdminUserPermissionsRecord.id),
    ).rejects.toThrow();
  });

  it(`allows user to update an organisation user permission record if;
      - standard orgUserPermission
  `, async () => {
    const { orgAdminUserPermissionsRecord, orgStandardUserPb } =
      await setupOrgUserPermissionRecordForDeleteTests();

    // delete org admin user permissions record with standard org user
    await expect(
      orgStandardUserPb
        .collection(organisationUserPermissionsCollectionName)
        .delete(orgAdminUserPermissionsRecord.id),
    ).rejects.toThrow();
  });

  it(`allows user to update an organisation user permission record if;
      - admin orgUserPermission
  `, async () => {
    const {
      globalAndOrgAdminUserPb,
      orgAdminUserPb,
      orgAdminUserPermissionsRecord,
      orgStandardUserPermissionsRecord,
    } = await setupOrgUserPermissionRecordForDeleteTests();

    // org admin user deletes standard org user's org permissions record
    const orgStandardUserPermsDeletedRecordResp = await orgAdminUserPb
      .collection(organisationUserPermissionsCollectionName)
      .delete(orgStandardUserPermissionsRecord.id);
    expect(orgStandardUserPermsDeletedRecordResp).toBeTruthy();

    // global and org admin user deletes org admin user's org permissions record
    const orgAdminUserPermsDeletedRecordResp = await globalAndOrgAdminUserPb
      .collection(organisationUserPermissionsCollectionName)
      .delete(orgAdminUserPermissionsRecord.id);
    expect(orgAdminUserPermsDeletedRecordResp).toBeTruthy();
  });
});
