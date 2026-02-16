import { beforeEach, describe, expect, it } from "vitest";
import { organisationNoteSeedFactory } from "../helpers/organisationNotesHelpers";
import { organisationSeedFactory } from "../helpers/organisationsCollectionHelpers";
import { organisationUserPermissionSeedFactory } from "../helpers/organisationUserPermissionHelpers";
import { createNewPbInstance } from "../helpers/pbInstanceHelpers";
import {
  organisationNotesCollectionName,
  organisationsCollectionName,
  organisationUserPermissionsCollectionName,
  superusersCollectionName,
  usersCollectionName,
} from "../helpers/pocketbaseMetadata";
import { clearDatabase } from "../helpers/pocketbaseTestHelpers";
import { userSeedFactory } from "../helpers/pocketbaseUserHelpers";
import { parsedEnv } from "../helpers/testEnvHelpers";

// createRule: @request.auth.id != "" && @collection.organisationUserPermissions.userId ?= @request.auth.id && @collection.organisationUserPermissions.organisationId ?= organisationId && (@collection.organisationUserPermissions.role ?= "admin" ||  @collection.organisationUserPermissions.role ?= "standard")

const setupOrgNotesRecordForCreateTests = async () => {
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
  };
};

describe(`organisation notes collection create rules - happy path`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it(`allows user to create an organisation note record if;
      - admin orgUserPermission
  `, async () => {
    const { globalAndOrgAdminUserPb, orgAdminUserPb, organisationRecord } =
      await setupOrgNotesRecordForCreateTests();
    const organisationNoteRecordResp1 = await globalAndOrgAdminUserPb
      .collection(organisationNotesCollectionName)
      .create(
        organisationNoteSeedFactory.forCreate({
          organisationId: organisationRecord.id,
          markdown: "some markdown content",
        }),
      );
    expect(organisationNoteRecordResp1).toBeTruthy();

    const organisationNoteRecordResp2 = await orgAdminUserPb
      .collection(organisationNotesCollectionName)
      .create(
        organisationNoteSeedFactory.forCreate({
          organisationId: organisationRecord.id,
          markdown: "some more markdown content",
        }),
      );
    expect(organisationNoteRecordResp2).toBeTruthy();
  });
});

describe(`organisation notes collection create rules - unhappy paths`, () => {
  beforeEach(async () => await clearDatabase());

  it(`denies user to create an organisation note record if;
      - standard orgUserPermission record
  `, async () => {
    const { orgStandardUserPb, organisationRecord } = await setupOrgNotesRecordForCreateTests();
    await expect(
      orgStandardUserPb.collection(organisationNotesCollectionName).create(
        organisationNoteSeedFactory.forCreate({
          organisationId: organisationRecord.id,
          markdown: "some markdown content",
        }),
      ),
    ).rejects.toThrow();
  });

  it(`denies user to create an organisation note record if;
      - no orgUserPermission record
  `, async () => {
    const { orgStandardUserPb, organisationRecord, superuserPb, orgStandardUserPermissionsRecord } =
      await setupOrgNotesRecordForCreateTests();

    await superuserPb
      .collection(organisationUserPermissionsCollectionName)
      .delete(orgStandardUserPermissionsRecord.id);

    await expect(
      orgStandardUserPb.collection(organisationNotesCollectionName).create(
        organisationNoteSeedFactory.forCreate({
          organisationId: organisationRecord.id,
          markdown: "some markdown content",
        }),
      ),
    ).rejects.toThrow();
  });
});
