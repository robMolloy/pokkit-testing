import { type ChildProcessWithoutNullStreams } from "child_process";
import fse from "fs-extra";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PocketBase } from "../../config/pocketbaseConfig";
import { setupAndServeTestDbFromRunningInstanceWithDefaults } from "../helpers/_helpers";
import { organisationDocumentSeedFactory } from "../helpers/organisationDocumentsHelpers";
import { organisationSeedFactory } from "../helpers/organisationsCollectionHelpers";
import { organisationUserPermissionSeedFactory } from "../helpers/organisationUserPermissionHelpers";
import {
  organisationDocumentsCollectionName,
  organisationDocumentVersionsCollectionName,
  organisationsCollectionName,
  organisationUserPermissionsCollectionName,
  superusersCollectionName,
  usersCollectionName,
} from "../helpers/pocketbaseMetadata";
import { clearDatabase } from "../helpers/pocketbaseTestHelpers";
import { userSeedFactory } from "../helpers/pocketbaseUserHelpers";
import { parsedEnv } from "../helpers/testEnvHelpers";

const testDirPath = `_temp/organisationDocumentVersionCollectionUpdateRules`;
const testDbUrl = `http://0.0.0.0:8044`;
const testDbSuperuserEmail = "admin@admin.com";
const testDbSuperuserPassword = "admin@admin.com";

const createPbInstance = () => new PocketBase(testDbUrl);

const getImage1File = async () => {
  const resp = fse.readFileSync("src/tests/organisationDocumentTests/image1.png");
  return new File([resp], "image1.png", { type: "image/png" });
};
const getImage2File = async () => {
  const resp = fse.readFileSync("src/tests/organisationDocumentTests/image2.png");
  return new File([resp], "image2.png", { type: "image/png" });
};

const setupOrgDocumentRecordsForUpdateTests = async () => {
  const superuserPb = createPbInstance();
  await superuserPb
    .collection(superusersCollectionName)
    .authWithPassword(parsedEnv.TEST_DB_USERNAME, parsedEnv.TEST_DB_PASSWORD);

  // --- Global + Org Admin User ---
  const globalAndOrgAdminUserPb = createPbInstance();
  const globalAndOrgAdminUserSeed = userSeedFactory.forCreateFilledIn();

  const globalAndOrgAdminUserRecord = await globalAndOrgAdminUserPb
    .collection(usersCollectionName)
    .create({
      email: globalAndOrgAdminUserSeed.email,
      password: globalAndOrgAdminUserSeed.password,
      passwordConfirm: globalAndOrgAdminUserSeed.password,
    });

  await globalAndOrgAdminUserPb
    .collection(usersCollectionName)
    .authWithPassword(globalAndOrgAdminUserSeed.email, globalAndOrgAdminUserSeed.password);

  // Create organisation — creator automatically gains an approved admin org permission
  const organisationRecord = await globalAndOrgAdminUserPb
    .collection(organisationsCollectionName)
    .create(organisationSeedFactory.forCreateFilledIn());

  // --- Org Admin User ---
  const orgAdminUserPb = createPbInstance();
  const orgAdminUserSeed = userSeedFactory.forCreateFilledIn();

  const orgAdminUserRecord = await orgAdminUserPb.collection(usersCollectionName).create({
    email: orgAdminUserSeed.email,
    password: orgAdminUserSeed.password,
    passwordConfirm: orgAdminUserSeed.password,
  });

  await orgAdminUserPb
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

  // --- Org Standard User ---
  const orgStandardUserPb = createPbInstance();
  const orgStandardUserSeed = userSeedFactory.forCreateFilledIn();

  const orgStandardUserRecord = await orgStandardUserPb.collection(usersCollectionName).create({
    email: orgStandardUserSeed.email,
    password: orgStandardUserSeed.password,
    passwordConfirm: orgStandardUserSeed.password,
  });

  await orgStandardUserPb
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

  // --- Not In Org User ---
  const notInOrgUserPb = createPbInstance();
  const notInOrgUserSeed = userSeedFactory.forCreateFilledIn();

  const notInOrgUserRecord = await notInOrgUserPb.collection(usersCollectionName).create({
    email: notInOrgUserSeed.email,
    password: notInOrgUserSeed.password,
    passwordConfirm: notInOrgUserSeed.password,
  });

  await notInOrgUserPb
    .collection(usersCollectionName)
    .authWithPassword(notInOrgUserSeed.email, notInOrgUserSeed.password);

  // Create two document records — one owned by each admin user — so the
  // happy path can verify both can update their own record independently
  const organisationDocumentRecord1 = await globalAndOrgAdminUserPb
    .collection(organisationDocumentsCollectionName)
    .create(
      organisationDocumentSeedFactory.forCreate({
        file: await getImage1File(),
        organisationId: organisationRecord.id,
      }),
    );

  const organisationDocumentRecord2 = await orgAdminUserPb
    .collection(organisationDocumentsCollectionName)
    .create(
      organisationDocumentSeedFactory.forCreate({
        file: await getImage1File(),
        organisationId: organisationRecord.id,
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

    notInOrgUserPb,
    notInOrgUserPlainTextRecord: { ...notInOrgUserRecord, ...notInOrgUserSeed },

    organisationDocumentRecord1,
    organisationDocumentRecord2,

    organisationRecord,
  };
};

let spawnProcess: ChildProcessWithoutNullStreams | undefined;

describe(`organisation document versions collection update rules - happy and unhappy paths`, () => {
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

  it(`allows user to update an organisation document version record file if;
      - admin orgUserPermission
  `, async () => {
    const {
      globalAndOrgAdminUserPb,
      orgAdminUserPb,
      organisationRecord,
      organisationDocumentRecord1,
      organisationDocumentRecord2,
      superuserPb,
    } = await setupOrgDocumentRecordsForUpdateTests();

    const organisationDocumentRecordUpdateResp1 = await globalAndOrgAdminUserPb
      .collection(organisationDocumentsCollectionName)
      .update(
        organisationDocumentRecord1.id,
        organisationDocumentSeedFactory.forCreate({
          file: await getImage2File(),
          organisationId: organisationRecord.id,
        }),
      );
    expect(organisationDocumentRecordUpdateResp1).toBeTruthy();

    const organisationDocumentRecordUpdateResp2 = await orgAdminUserPb
      .collection(organisationDocumentsCollectionName)
      .update(
        organisationDocumentRecord2.id,
        organisationDocumentSeedFactory.forCreate({
          file: await getImage2File(),
          organisationId: organisationRecord.id,
        }),
      );
    expect(organisationDocumentRecordUpdateResp2).toBeTruthy();

    const records = await superuserPb
      .collection(organisationDocumentVersionsCollectionName)
      .getFullList();
    expect(records.map((doc) => doc.fileName)).toEqual([
      "image1.png",
      "image1.png",
      "image2.png",
      "image2.png",
    ]);
  });
});
