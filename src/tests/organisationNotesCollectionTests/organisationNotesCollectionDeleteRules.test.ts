import type { ChildProcessWithoutNullStreams } from "child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PocketBase } from "../../config/pocketbaseConfig";
import { setupAndServeTestDb } from "../helpers/_helpers";
import { organisationNoteSeedFactory } from "../helpers/organisationNotesHelpers";
import { organisationSeedFactory } from "../helpers/organisationsCollectionHelpers";
import { organisationUserPermissionSeedFactory } from "../helpers/organisationUserPermissionHelpers";
import {
  organisationNotesCollectionName,
  organisationsCollectionName,
  organisationUserPermissionsCollectionName,
  superusersCollectionName,
  usersCollectionName,
} from "../helpers/pocketbaseMetadata";
import { clearSpecifiedDatabase } from "../helpers/pocketbaseTestHelpers";
import { userSeedFactory } from "../helpers/pocketbaseUserHelpers";
import { parsedEnv } from "../helpers/testEnvHelpers";

// deleteRule: @request.auth.id != "" && @collection.organisationUserPermissions.userId ?= @request.auth.id && @collection.organisationUserPermissions.organisationId ?= organisationId && @collection.organisationUserPermissions.role ?= "admin"

const pocketbaseBuildFilePath = `pocketbase/app-db/builds/app-db`;
const testDirPath = `_temp/organisationNotesCollectionDeleteRules`;

const appDbUrl = "http://0.0.0.0:8090";
const appDbSuperuserEmail = "admin@admin.com";
const appDbSuperuserPassword = "admin@admin.com";
const testDbUrl = `http://0.0.0.0:8072`;
const testDbSuperuserEmail = "admin@admin.com";
const testDbSuperuserPassword = "admin@admin.com";

const createNewPbInstance = () => new PocketBase(testDbUrl);

let spawnProcess: ChildProcessWithoutNullStreams | undefined;
const setupOrgNotesRecordForDeleteTests = async () => {
  const superuserPb = createNewPbInstance();
  await superuserPb
    .collection(superusersCollectionName)
    .authWithPassword(parsedEnv.TEST_DB_USERNAME, parsedEnv.TEST_DB_PASSWORD);

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
  //  create org admin user record
  const orgAdminUserRecord = await orgAdminUserPb.collection(usersCollectionName).create({
    email: orgAdminUserSeed.email,
    password: orgAdminUserSeed.password,
    passwordConfirm: orgAdminUserSeed.password,
  });

  // log in org admin user
  await orgAdminUserPb
    .collection(usersCollectionName)
    .authWithPassword(orgAdminUserSeed.email, orgAdminUserSeed.password);

  // create org admin user permissions record
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
  // create org standard user record
  const orgStandardUserRecord = await orgStandardUserPb.collection(usersCollectionName).create({
    email: orgStandardUserSeed.email,
    password: orgStandardUserSeed.password,
    passwordConfirm: orgStandardUserSeed.password,
  });
  // log in org standard user
  await orgStandardUserPb
    .collection(usersCollectionName)
    .authWithPassword(orgStandardUserSeed.email, orgStandardUserSeed.password);

  // create org standard user permissions record
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

  const notInOrgUserPb = createNewPbInstance();
  const notInOrgUserSeed = userSeedFactory.forCreateFilledIn();
  // create not in org user record
  const notInOrgUserRecord = await notInOrgUserPb.collection(usersCollectionName).create({
    email: notInOrgUserSeed.email,
    password: notInOrgUserSeed.password,
    passwordConfirm: notInOrgUserSeed.password,
  });
  // log in not in org user
  await notInOrgUserPb
    .collection(usersCollectionName)
    .authWithPassword(notInOrgUserSeed.email, notInOrgUserSeed.password);

  const organisationNoteRecord1 = await globalAndOrgAdminUserPb
    .collection(organisationNotesCollectionName)
    .create(
      organisationNoteSeedFactory.forCreate({
        organisationId: organisationRecord.id,
        markdown: "some markdown content",
      }),
    );
  const organisationNoteRecord2 = await globalAndOrgAdminUserPb
    .collection(organisationNotesCollectionName)
    .create(
      organisationNoteSeedFactory.forCreate({
        organisationId: organisationRecord.id,
        markdown: "some other markdown content",
      }),
    );

  return {
    superuserPb,

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

    organisationRecord,

    notInOrgUserPb,
    notInOrgUserPlainTextRecord: { ...notInOrgUserRecord, ...notInOrgUserSeed },

    organisationNoteRecord1,
    organisationNoteRecord2,
  };
};

describe(`organisation notes collection delete rules - happy and unhappy paths`, () => {
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
    await clearSpecifiedDatabase({
      testDbUrl,
      testDbSuperuserEmail,
      testDbSuperuserPassword,
    });
  });

  it(`allows user to delete an organisation note record if;
      - admin orgUserPermission
  `, async () => {
    const {
      globalAndOrgAdminUserPb,
      orgAdminUserPb,
      organisationNoteRecord1,
      organisationNoteRecord2,
    } = await setupOrgNotesRecordForDeleteTests();

    const organisationNoteRecordResp1 = await globalAndOrgAdminUserPb
      .collection(organisationNotesCollectionName)
      .delete(organisationNoteRecord1.id);
    expect(organisationNoteRecordResp1).toBeTruthy();

    const organisationNoteRecordResp2 = await orgAdminUserPb
      .collection(organisationNotesCollectionName)
      .delete(organisationNoteRecord2.id);
    expect(organisationNoteRecordResp2).toBeTruthy();
  });

  it(`denies user to delete an organisation note record if;
      - standard orgUserPermission record
  `, async () => {
    const { orgStandardUserPb, organisationNoteRecord1 } =
      await setupOrgNotesRecordForDeleteTests();

    await expect(
      orgStandardUserPb
        .collection(organisationNotesCollectionName)
        .delete(organisationNoteRecord1.id),
    ).rejects.toThrow();
  });

  it(`denies user to delete an organisation note record if;
      - no orgUserPermission record
  `, async () => {
    const {
      orgStandardUserPb,
      organisationNoteRecord1,
      superuserPb,
      orgStandardUserPermissionsRecord,
    } = await setupOrgNotesRecordForDeleteTests();

    await superuserPb
      .collection(organisationUserPermissionsCollectionName)
      .delete(orgStandardUserPermissionsRecord.id);

    await expect(
      orgStandardUserPb
        .collection(organisationNotesCollectionName)
        .delete(organisationNoteRecord1.id),
    ).rejects.toThrow();
  });
});
