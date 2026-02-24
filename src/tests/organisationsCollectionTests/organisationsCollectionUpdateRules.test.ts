import type { ChildProcessWithoutNullStreams } from "child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PocketBase } from "../../config/pocketbaseConfig";
import { setupAndServeTestDb } from "../helpers/_helpers";
import { createOrganisationRecordSeedData } from "../helpers/organisationsCollectionHelpers";
import { organisationUserPermissionSeedFactory } from "../helpers/organisationUserPermissionHelpers";
import {
  globalUserPermissionsCollectionName,
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
const testDirPath = `_temp/organisationsCollectionUpdateRules`;

const appDbUrl = "http://0.0.0.0:8090";
const appDbSuperuserEmail = "admin@admin.com";
const appDbSuperuserPassword = "admin@admin.com";
const testDbUrl = `http://0.0.0.0:8084`;
const testDbSuperuserEmail = "admin@admin.com";
const testDbSuperuserPassword = "admin@admin.com";

const createNewPbInstance = () => new PocketBase(testDbUrl);

let spawnProcess: ChildProcessWithoutNullStreams | undefined;

describe(`organisations update rules for user with role of "standard" or "admin" in organisationUserPermissions`, () => {
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

  it("denies user with standard orgPermission to update an organisation record", async () => {
    const superuserPb = createNewPbInstance();
    const userPb = createNewPbInstance();
    // first user gains an approved admin global permission
    const adminUserSeed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: adminUserSeed.email,
      password: adminUserSeed.password,
      passwordConfirm: adminUserSeed.password,
    });

    const user1Seed = createUserEmailPasswordData();
    const user1Record = await userPb.collection(usersCollectionName).create({
      email: user1Seed.email,
      password: user1Seed.password,
      passwordConfirm: user1Seed.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(adminUserSeed.email, adminUserSeed.password);
    // creator user gains an approved admin organisation permission
    const organisationSeedData = createOrganisationRecordSeedData();
    const organisationRecord = await userPb
      .collection(organisationsCollectionName)
      .create(organisationSeedData);

    userPb.authStore.clear();

    await superuserPb
      .collection(superusersCollectionName)
      .authWithPassword("admin@admin.com", "admin@admin.com");

    const userId = user1Record.id;
    const organisationId = organisationRecord.id;

    const organisationUserPermissionSeed = organisationUserPermissionSeedFactory.forCreate({
      userId,
      organisationId,
      role: "standard",
      status: "approved",
    });

    await superuserPb
      .collection(organisationUserPermissionsCollectionName)
      .create(organisationUserPermissionSeed);

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(user1Seed.email, user1Seed.password);

    await expect(
      userPb
        .collection(organisationsCollectionName)
        .update(organisationRecord.id, { name: "Updated Organisation Name" }),
    ).rejects.toThrow();
  });

  it("denies user with no orgPermission to update an organisation record", async () => {
    const userPb = createNewPbInstance();
    // first user gains an approved admin global permission
    const adminUserSeed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: adminUserSeed.email,
      password: adminUserSeed.password,
      passwordConfirm: adminUserSeed.password,
    });

    const user1Seed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: user1Seed.email,
      password: user1Seed.password,
      passwordConfirm: user1Seed.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(adminUserSeed.email, adminUserSeed.password);
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
      userPb
        .collection(organisationsCollectionName)
        .update(organisationRecord.id, { name: "Updated Organisation Name" }),
    ).rejects.toThrow();
  });

  it(`allows user to update an organisation record if;
    - admin orgPermission 
    - standard/admin/no globalPermission`, async () => {
    const superuserPb = createNewPbInstance();
    const userPb = createNewPbInstance();
    await superuserPb
      .collection(superusersCollectionName)
      .authWithPassword(parsedEnv.TEST_DB_USERNAME, parsedEnv.TEST_DB_PASSWORD);

    // first user gains an approved admin global permission
    const globalAdminUserSeed = createUserEmailPasswordData();
    const globalAdminUserRecord = await userPb.collection(usersCollectionName).create({
      email: globalAdminUserSeed.email,
      password: globalAdminUserSeed.password,
      passwordConfirm: globalAdminUserSeed.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(globalAdminUserSeed.email, globalAdminUserSeed.password);

    // creator user gains an approved admin organisation permission
    const organisationSeedData = createOrganisationRecordSeedData();
    const organisationRecord = await userPb
      .collection(organisationsCollectionName)
      .create(organisationSeedData);

    const updatedOrganisationRecord1 = await userPb
      .collection(organisationsCollectionName)
      .update(organisationRecord.id, { name: "Updated Organisation Name" });
    expect(updatedOrganisationRecord1.name).toBe("Updated Organisation Name");

    await superuserPb
      .collection(globalUserPermissionsCollectionName)
      .update(globalAdminUserRecord.id, { role: "standard" });

    const updatedOrganisationRecord2 = await userPb
      .collection(organisationsCollectionName)
      .update(organisationRecord.id, { name: "Updated Organisation2 Name" });

    expect(updatedOrganisationRecord2.name).toBe("Updated Organisation2 Name");

    await superuserPb
      .collection(globalUserPermissionsCollectionName)
      .delete(globalAdminUserRecord.id);

    const updatedOrganisationRecord3 = await userPb
      .collection(organisationsCollectionName)
      .update(organisationRecord.id, { name: "Updated Organisation3 Name" });

    expect(updatedOrganisationRecord3.name).toBe("Updated Organisation3 Name");
  });
});
