import type { ChildProcessWithoutNullStreams } from "child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PocketBase } from "../../config/pocketbaseConfig";
import { setupAndServeTestDb } from "../helpers/_helpers";
import { createOrganisationRecordSeedData } from "../helpers/organisationsCollectionHelpers";
import { organisationUserPermissionSeedFactory } from "../helpers/organisationUserPermissionHelpers";
import {
  organisationsCollectionName,
  organisationUserPermissionsCollectionName,
  usersCollectionName,
} from "../helpers/pocketbaseMetadata";
import { clearDatabase } from "../helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData } from "../helpers/pocketbaseUserHelpers";

// createRule: @request.auth.id != "" && @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"
// Standard: @request.auth.id != "" && @request.auth.id = id
// Admin:    @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"

const pocketbaseBuildFilePath = `pocketbase/app-db/builds/app-db`;
const testDirPath = `_temp/organisationsUserPermissionsCollectionCreateRules`;

const appDbUrl = "http://0.0.0.0:8090";
const appDbSuperuserEmail = "admin@admin.com";
const appDbSuperuserPassword = "admin@admin.com";
const testDbUrl = `http://0.0.0.0:8091`;
const testDbSuperuserEmail = "admin@admin.com";
const testDbSuperuserPassword = "admin@admin.com";

const createNewPbInstance = () => new PocketBase(testDbUrl);

let spawnProcess: ChildProcessWithoutNullStreams | undefined;

describe(`organisation user permissions collection create rules - happy and unhappy paths`, () => {
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

  it(`denies user to create an organisation user permission record if;
      - no orgUserPermission
  `, async () => {
    const userPb = createNewPbInstance();

    // first user gains an approved admin global permission
    const globalAndOrgAdminUserSeed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: globalAndOrgAdminUserSeed.email,
      password: globalAndOrgAdminUserSeed.password,
      passwordConfirm: globalAndOrgAdminUserSeed.password,
    });

    const user1Seed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: user1Seed.email,
      password: user1Seed.password,
      passwordConfirm: user1Seed.password,
    });
    const user2Seed = createUserEmailPasswordData();
    const user2Record = await userPb.collection(usersCollectionName).create({
      email: user2Seed.email,
      password: user2Seed.password,
      passwordConfirm: user2Seed.password,
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
    await userPb
      .collection(usersCollectionName)
      .authWithPassword(user1Seed.email, user1Seed.password);

    await expect(
      userPb.collection(organisationUserPermissionsCollectionName).create(
        organisationUserPermissionSeedFactory.forCreate({
          userId: user2Record.id,
          organisationId: organisationRecord.id,
          role: "admin",
          status: "approved",
        }),
      ),
    ).rejects.toThrow();
  });

  it(`allows user to create an organisation user permission record if;
      - standard orgUserPermission
  `, async () => {
    const userPb = createNewPbInstance();

    // first user gains an approved admin global permission
    const globalAndOrgAdminUserSeed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: globalAndOrgAdminUserSeed.email,
      password: globalAndOrgAdminUserSeed.password,
      passwordConfirm: globalAndOrgAdminUserSeed.password,
    });

    const user1Seed = createUserEmailPasswordData();
    const user1Record = await userPb.collection(usersCollectionName).create({
      email: user1Seed.email,
      password: user1Seed.password,
      passwordConfirm: user1Seed.password,
    });
    const user2Seed = createUserEmailPasswordData();
    const user2Record = await userPb.collection(usersCollectionName).create({
      email: user2Seed.email,
      password: user2Seed.password,
      passwordConfirm: user2Seed.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(globalAndOrgAdminUserSeed.email, globalAndOrgAdminUserSeed.password);

    // creator user gains an approved admin organisation permission
    const organisationSeedData = createOrganisationRecordSeedData();
    const organisationRecord = await userPb
      .collection(organisationsCollectionName)
      .create(organisationSeedData);

    const orgUser1PermsRecords = await userPb
      .collection(organisationUserPermissionsCollectionName)
      .create(
        organisationUserPermissionSeedFactory.forCreate({
          userId: user1Record.id,
          organisationId: organisationRecord.id,
          role: "standard",
          status: "approved",
        }),
      );
    expect(orgUser1PermsRecords).toBeTruthy();

    userPb.authStore.clear();
    await userPb
      .collection(usersCollectionName)
      .authWithPassword(user1Seed.email, user1Seed.password);

    await expect(
      userPb.collection(organisationUserPermissionsCollectionName).create(
        organisationUserPermissionSeedFactory.forCreate({
          userId: user2Record.id,
          organisationId: organisationRecord.id,
          role: "standard",
          status: "approved",
        }),
      ),
    ).rejects.toThrow();
  });

  it(`allows user to create an organisation user permission record if;
      - admin orgUserPermission
  `, async () => {
    const userPb = createNewPbInstance();

    // first user gains an approved admin global permission
    const globalAndOrgAdminUserSeed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: globalAndOrgAdminUserSeed.email,
      password: globalAndOrgAdminUserSeed.password,
      passwordConfirm: globalAndOrgAdminUserSeed.password,
    });

    const user1Seed = createUserEmailPasswordData();
    const user1Record = await userPb.collection(usersCollectionName).create({
      email: user1Seed.email,
      password: user1Seed.password,
      passwordConfirm: user1Seed.password,
    });
    const user2Seed = createUserEmailPasswordData();
    const user2Record = await userPb.collection(usersCollectionName).create({
      email: user2Seed.email,
      password: user2Seed.password,
      passwordConfirm: user2Seed.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(globalAndOrgAdminUserSeed.email, globalAndOrgAdminUserSeed.password);

    // creator user gains an approved admin organisation permission
    const organisationSeedData = createOrganisationRecordSeedData();
    const organisationRecord = await userPb
      .collection(organisationsCollectionName)
      .create(organisationSeedData);

    const orgUser1PermsRecords = await userPb
      .collection(organisationUserPermissionsCollectionName)
      .create(
        organisationUserPermissionSeedFactory.forCreate({
          userId: user1Record.id,
          organisationId: organisationRecord.id,
          role: "admin",
          status: "approved",
        }),
      );
    expect(orgUser1PermsRecords).toBeTruthy();

    userPb.authStore.clear();
    await userPb
      .collection(usersCollectionName)
      .authWithPassword(user1Seed.email, user1Seed.password);

    const orgUser2PermsRecords = await userPb
      .collection(organisationUserPermissionsCollectionName)
      .create(
        organisationUserPermissionSeedFactory.forCreate({
          userId: user2Record.id,
          organisationId: organisationRecord.id,
          role: "admin",
          status: "approved",
        }),
      );
    expect(orgUser2PermsRecords).toBeTruthy();
  });
});
