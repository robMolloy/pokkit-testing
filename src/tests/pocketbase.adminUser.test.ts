import type { ChildProcessWithoutNullStreams } from "child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PocketBase } from "../config/pocketbaseConfig";
import { setupAndServeTestDb } from "./helpers/_helpers";
import {
  globalUserPermissionsCollectionName,
  superusersCollectionName,
  usersCollectionName,
} from "./helpers/pocketbaseMetadata";
import { clearDatabase } from "./helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData, createUserRecord } from "./helpers/pocketbaseUserHelpers";
import { parsedEnv } from "./helpers/testEnvHelpers";

const pocketbaseBuildFilePath = `pocketbase/app-db/builds/app-db`;
const testDirPath = `_temp/pocketbase-adminUser`;

const appDbUrl = "http://0.0.0.0:8090";
const appDbSuperuserEmail = "admin@admin.com";
const appDbSuperuserPassword = "admin@admin.com";
const testDbUrl = `http://0.0.0.0:8111`;
const testDbSuperuserEmail = "admin@admin.com";
const testDbSuperuserPassword = "admin@admin.com";

const createPbInstance = () => new PocketBase(testDbUrl);

let spawnProcess: ChildProcessWithoutNullStreams | undefined;

describe("PocketBase admin users collection rules", () => {
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

  it("allow create: the first user created receives approved admin global permission", async () => {
    const superuserPb = createPbInstance();
    const userPb = createPbInstance();

    const userData1 = createUserEmailPasswordData();
    const userRecord1 = await userPb.collection(usersCollectionName).create({
      email: userData1.email,
      password: userData1.password,
      passwordConfirm: userData1.password,
    });
    await createUserRecord({ pb: userPb }); // throwaway record
    await createUserRecord({ pb: userPb }); // throwaway record
    await createUserRecord({ pb: userPb }); // throwaway record

    expect(userRecord1.id).not.toBeNull();

    await userPb
      .collection(usersCollectionName)
      .authWithPassword(userData1.email, userData1.password);

    await superuserPb
      .collection(superusersCollectionName)
      .authWithPassword(parsedEnv.TEST_DB_USERNAME, parsedEnv.TEST_DB_PASSWORD);

    const createdGlobalUserPermissionsRecord = await superuserPb
      .collection(globalUserPermissionsCollectionName)
      .getOne(userRecord1.id);

    expect(createdGlobalUserPermissionsRecord.id).toBe(userRecord1.id);
    expect(createdGlobalUserPermissionsRecord.role).toBe("admin");
    expect(createdGlobalUserPermissionsRecord.status).toBe("approved");

    const users = await userPb.collection(usersCollectionName).getFullList();
    expect(users.length).toBe(4);

    const notOwnUsers = users.filter((u) => u.id !== userRecord1.id);

    for (const user of notOwnUsers) {
      const userRecord = await userPb.collection(usersCollectionName).getOne(user.id);
      expect(userRecord.id).toBe(user.id);
    }
  });
});
