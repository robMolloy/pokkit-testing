import {
  clearDb,
  killPocketbaseInstanceByDbUrl,
  killPocketbaseInstanceBySpawnProcess,
  setupAndServeDb,
} from "@repo/pokkit-testing";
import type { ChildProcessWithoutNullStreams } from "child_process";
import fse from "fs-extra";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PocketBase } from "../config/pocketbaseConfig";
import { usersCollectionName } from "../metadata/pocketbaseMetadata";
import {
  createRandomUserEmailPasswordData,
  createRandomUserRecord,
} from "../utils/pocketbaseUserHelpers";

const dbBuildFilePath = "./pb/app-db";

const sandboxDirPath = `_temp/test`;
const sandboxDbBuildFilePath = `${sandboxDirPath}/app-db`;
const sandboxDbLogFilePath = `${sandboxDirPath}/log.txt`;

const sandboxDbPortNumber = 8113;
const sandboxDbUrl = `http://0.0.0.0:${sandboxDbPortNumber}`;
const sandboxDbSuperuserEmail = "admin@admin.com";
const sandboxDbSuperuserPassword = "admin@admin.com";

const createPbInstance = () => new PocketBase(sandboxDbUrl);
let spawnProcess: ChildProcessWithoutNullStreams | undefined;

describe("test rules", () => {
  beforeAll(async () => {
    spawnProcess = await setupAndServeDb({
      writeDbBuildToFilePathFn: async () => {
        await fse.copyFileSync(dbBuildFilePath, sandboxDbBuildFilePath);
      },
      applyCollections: { required: false },
      dbBuildFilePath: sandboxDbBuildFilePath,
      dbLogFilePath: sandboxDbLogFilePath,
      dbUrl: sandboxDbUrl,
      dbSuperuserEmail: sandboxDbSuperuserEmail,
      dbSuperuserPassword: sandboxDbSuperuserPassword,
    });
  });

  afterAll(async () => {
    if (spawnProcess) killPocketbaseInstanceBySpawnProcess(spawnProcess);
    killPocketbaseInstanceByDbUrl(sandboxDbUrl);
    await fse.remove(sandboxDirPath);
  });

  beforeEach(async () => {
    await clearDb({
      dbUrl: sandboxDbUrl,
      dbSuperuserEmail: sandboxDbSuperuserEmail,
      dbSuperuserPassword: sandboxDbSuperuserPassword,
    });
  });

  it("true test", async () => {
    expect(true).toBe(true);
  });

  it("rejects invalid authentication", async () => {
    const pb = createPbInstance();
    expect(pb).toBeInstanceOf(PocketBase);
    const userPb = createPbInstance();
    await expect(
      userPb.collection(usersCollectionName).authWithPassword("test@example.com", "wrong-password"),
    ).rejects.toThrow();
  });

  it("allow create:  user with valid email and password", async () => {
    const userPb = createPbInstance();

    // throwaway record - first user gains an approved admin global permission
    await createRandomUserRecord({ pb: userPb });

    const userData = createRandomUserEmailPasswordData();
    const resp = await userPb.collection(usersCollectionName).create({
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.password,
    });
    expect(resp.id).not.toBeNull();
  });

  it("deny read: user record when not authenticated; allow read: of own user record when authenticated; deny read: of other user records when authenticated", async () => {
    const userPb = createPbInstance();

    // throwaway record - first user gains an approved admin global permission
    await createRandomUserRecord({ pb: userPb });

    const userData1 = createRandomUserEmailPasswordData();
    const userRecord1 = await userPb.collection(usersCollectionName).create({
      email: userData1.email,
      password: userData1.password,
      passwordConfirm: userData1.password,
    });
    const userData2 = createRandomUserEmailPasswordData();
    const userRecord2 = await userPb.collection(usersCollectionName).create({
      email: userData2.email,
      password: userData2.password,
      passwordConfirm: userData2.password,
    });

    // Verify unauthenticated access is denied
    await expect(userPb.collection(usersCollectionName).getOne(userRecord1.id)).rejects.toThrow();

    // Authenticate as user 1
    await userPb
      .collection(usersCollectionName)
      .authWithPassword(userData1.email, userData1.password);

    // Verify authenticated access is allowed
    const record = await userPb.collection(usersCollectionName).getOne(userRecord1.id);
    expect(record.id).toBe(userRecord1.id);

    // Verify authenticated access is denied for other user records
    await expect(userPb.collection(usersCollectionName).getOne(userRecord2.id)).rejects.toThrow();
  });

  it("allow list: standard user returns list with only own record when authenticated; allow list: when not authenticated list returns empty array", async () => {
    const userPb = createPbInstance();

    // throwaway record - first user gains an approved admin global permission
    await createRandomUserRecord({ pb: userPb });

    const userData1 = createRandomUserEmailPasswordData();
    const userRecord1 = await userPb.collection(usersCollectionName).create({
      email: userData1.email,
      password: userData1.password,
      passwordConfirm: userData1.password,
    });
    const userData2 = createRandomUserEmailPasswordData();
    await userPb.collection(usersCollectionName).create({
      email: userData2.email,
      password: userData2.password,
      passwordConfirm: userData2.password,
    });

    // Verify unauthenticated access is denied
    const unauthRecords = await userPb.collection(usersCollectionName).getFullList();

    expect(unauthRecords.length).toBe(0);

    // Authenticate as user 1
    await userPb
      .collection(usersCollectionName)
      .authWithPassword(userData1.email, userData1.password);

    // Verify list returns only own record
    const records = await userPb.collection(usersCollectionName).getFullList();
    expect(records.length).toBe(1);
    expect(records[0]?.id).toBe(userRecord1.id);
  });
});
