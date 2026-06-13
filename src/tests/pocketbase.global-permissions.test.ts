import type { ChildProcessWithoutNullStreams } from "child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PocketBase } from "../config/pocketbaseConfig";
import { setupAndServeSanboxedPbBuildWithDefaults } from "./helpers/_helpers";
import {
  globalUserPermissionsCollectionName,
  usersCollectionName,
} from "./helpers/pocketbaseMetadata";
import { clearDatabase } from "./helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData } from "./helpers/pocketbaseUserHelpers";
import fse from "fs-extra";

const testDirPath = `_temp/pocketbase-globalPermissions`;
const testDbUrl = `http://0.0.0.0:8112`;
const testDbSuperuserEmail = "admin@admin.com";
const testDbSuperuserPassword = "admin@admin.com";

const createPbInstance = () => new PocketBase(testDbUrl);

let spawnProcess: ChildProcessWithoutNullStreams | undefined;

describe("PocketBase users collection global permissions", () => {
  beforeAll(async () => {
    await spawnProcess?.kill("SIGTERM");
    spawnProcess = await setupAndServeSanboxedPbBuildWithDefaults({
      sandboxDirPath: testDirPath,
      sandboxDbUrl: testDbUrl,
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

  it.only("allow create and read: first user receives approved admin global permission", async () => {
    const userPb = createPbInstance();

    const { email, password } = createUserEmailPasswordData();
    const userRecord = await userPb.collection(usersCollectionName).create({
      email,
      password,
      passwordConfirm: password,
    });

    await userPb.collection(usersCollectionName).authWithPassword(email, password);

    expect(userRecord.id).not.toBeNull();

    const createdGlobalUserPermissionsRecord = await userPb
      .collection(globalUserPermissionsCollectionName)
      .getOne(userRecord.id);

    expect(createdGlobalUserPermissionsRecord.id).toBe(userRecord.id);
    expect(createdGlobalUserPermissionsRecord.role).toBe("admin");
    expect(createdGlobalUserPermissionsRecord.status).toBe("approved");

    userPb.authStore.clear();

    await expect(
      userPb.collection(globalUserPermissionsCollectionName).getOne(userRecord.id),
    ).rejects.toThrow();
  });
});
