import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  clearDb,
  killPocketbaseInstanceByDbUrl,
  killPocketbaseInstanceBySpawnProcess,
  setupAndServeDb,
} from "@repo/pokkit-testing";
import type { CollectionModel } from "pocketbase";
import type { ChildProcessWithoutNullStreams } from "child_process";
import { PocketBase } from "../config/pocketbaseConfig";
import fse from "fs-extra";
import { usersCollectionName } from "../metadata/pocketbaseMetadata";
import {
  createRandomUserRecord,
  createRandomUserEmailPasswordData,
} from "../utils/pocketbaseUserHelpers";

const sandboxedDirPath = `_temp/test`;
const dbBuildFilePath = `${sandboxedDirPath}/app-db`;
const dbLogFilePath = `${sandboxedDirPath}/log.txt`;

const dbUrl = `http://0.0.0.0:8113`;
const dbSuperuserEmail = "admin@admin.com";
const dbSuperuserPassword = "admin@admin.com";

const createPbInstance = () => new PocketBase(dbUrl);
let spawnProcess: ChildProcessWithoutNullStreams | undefined;

describe("test rules", () => {
  beforeAll(async () => {
    spawnProcess = await setupAndServeDb({
      writeDbBuildToFilePathFn: async () => {
        await fse.copyFileSync("./pb/app-db", dbBuildFilePath);
      },
      getCollectionsFn: async function (): Promise<CollectionModel[]> {
        const collectionsJson = await fse.readFileSync("./pb/collections.json", "utf8");
        const collections: CollectionModel[] = JSON.parse(collectionsJson);
        return collections;
      },
      dbBuildFilePath,
      dbLogFilePath,
      dbUrl,
      dbSuperuserEmail,
      dbSuperuserPassword,
    });
  });

  afterAll(async () => {
    if (spawnProcess) killPocketbaseInstanceBySpawnProcess(spawnProcess);
    killPocketbaseInstanceByDbUrl(dbUrl);
    await fse.remove(sandboxedDirPath);
  });

  beforeEach(async () => {
    await clearDb({ dbUrl, dbSuperuserEmail, dbSuperuserPassword });
  });

  it("true test", async () => {
    expect(true).toBe(true);
  });

  it("pb test", async () => {
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
