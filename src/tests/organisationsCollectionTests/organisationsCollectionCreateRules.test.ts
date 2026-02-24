import type { ChildProcessWithoutNullStreams } from "child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PocketBase } from "../../config/pocketbaseConfig";
import { setupAndServeTestDb } from "../helpers/_helpers";
import { createGlobalUserPermissionRecordSeedData } from "../helpers/globalUserPermissionHelpers";
import { createOrganisationRecordSeedData } from "../helpers/organisationsCollectionHelpers";
import {
  globalUserPermissionsCollectionName,
  organisationsCollectionName,
  superusersCollectionName,
  usersCollectionName,
} from "../helpers/pocketbaseMetadata";
import { clearDatabase } from "../helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData, createUserRecord } from "../helpers/pocketbaseUserHelpers";

// createRule: @request.auth.id != "" && @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"
// Standard: @request.auth.id != "" && @request.auth.id = id
// Admin:    @collection.globalUserPermissions.id ?= @request.auth.id && @collection.globalUserPermissions.role ?= "admin"

const pocketbaseBuildFilePath = `pocketbase/app-db/builds/app-db`;
const testDirPath = `_temp/organisationsCollectionCreateRules`;

const appDbUrl = "http://0.0.0.0:8090";
const appDbSuperuserEmail = "admin@admin.com";
const appDbSuperuserPassword = "admin@admin.com";
const testDbUrl = `http://0.0.0.0:8081`;
const testDbSuperuserEmail = "admin@admin.com";
const testDbSuperuserPassword = "admin@admin.com";

const createNewPbInstance = () => new PocketBase(testDbUrl);

let spawnProcess: ChildProcessWithoutNullStreams | undefined;

describe(`PocketBase organisations collection create rules as standard/admin user`, () => {
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

  it("denies standard user to create an organisation record for an existing user if the user has a non admin globalPermissionRecord", async () => {
    // throwaway record - first user gains an approved admin global permission
    const userPb = createNewPbInstance();
    await createUserRecord({ pb: userPb });

    // first user gains an approved admin global permission
    const user1Seed = createUserEmailPasswordData();
    const user1Record = await userPb.collection(usersCollectionName).create({
      email: user1Seed.email,
      password: user1Seed.password,
      passwordConfirm: user1Seed.password,
    });

    const superuserPb = createNewPbInstance();
    await superuserPb
      .collection(superusersCollectionName)
      .authWithPassword("admin@admin.com", "admin@admin.com");

    await superuserPb.collection(globalUserPermissionsCollectionName).create({
      id: user1Record.id,
      userId: user1Record.id,
      ...createGlobalUserPermissionRecordSeedData(),
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(user1Seed.email, user1Seed.password);

    const organisationSeedData = createOrganisationRecordSeedData();
    await expect(
      userPb.collection(organisationsCollectionName).create(organisationSeedData),
    ).rejects.toThrow();
  });

  it("denies standard user to create a globalUserPermissions record for an existing user if the user is missing a globalPermission record", async () => {
    // throwaway record - first user gains an approved admin global permission
    const userPb = createNewPbInstance();
    await createUserRecord({ pb: userPb });

    // first user gains an approved admin global permission
    const user1Seed = createUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: user1Seed.email,
      password: user1Seed.password,
      passwordConfirm: user1Seed.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(user1Seed.email, user1Seed.password);

    const organisationSeedData = createOrganisationRecordSeedData();
    await expect(
      userPb.collection(organisationsCollectionName).create(organisationSeedData),
    ).rejects.toThrow();
  });

  it("allows admin user to create an organisation record", async () => {
    // first user gains an approved admin global permission
    const adminUserSeed = createUserEmailPasswordData();
    const userPb = createNewPbInstance();
    await userPb.collection(usersCollectionName).create({
      email: adminUserSeed.email,
      password: adminUserSeed.password,
      passwordConfirm: adminUserSeed.password,
    });

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(adminUserSeed.email, adminUserSeed.password);

    const organisationSeedData = createOrganisationRecordSeedData();

    const organisationRecord = await userPb
      .collection(organisationsCollectionName)
      .create(organisationSeedData);
    expect(organisationRecord).toBeDefined();
    expect(organisationRecord.name).toBe(organisationSeedData.name);
    expect(organisationRecord.description).toBe(organisationSeedData.description);
    expect(organisationRecord.id).toBeDefined();
  });
});
