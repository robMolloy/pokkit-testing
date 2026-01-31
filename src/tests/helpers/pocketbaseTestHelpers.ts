import { superuserPb, userPb } from "../../config/pocketbaseConfig";
import { exec } from "child_process";
import { promisify } from "util";
import { superusersCollectionName } from "./pocketbaseMetadata";
import { parsedEnv } from "./testEnvHelpers";

const execAsync = promisify(exec);

export async function clearDatabase() {
  await execAsync(
    `./pocketbase/test-db/pocketbase superuser upsert ${parsedEnv.TEST_DB_USERNAME} ${parsedEnv.TEST_DB_PASSWORD}`,
  );

  await superuserPb
    .collection(superusersCollectionName)
    .authWithPassword(parsedEnv.TEST_DB_USERNAME, parsedEnv.TEST_DB_PASSWORD);

  const collections = await superuserPb.collections.getFullList();
  const nonSuperuserCollections = collections.filter(
    (coll) => coll.name !== superusersCollectionName,
  );
  for (const coll of nonSuperuserCollections) {
    await superuserPb.collections.truncate(coll.name);
  }

  const superuserRecords = await superuserPb.collection(superusersCollectionName).getFullList();
  for (const record of superuserRecords) {
    if (record.email !== parsedEnv.TEST_DB_USERNAME)
      await superuserPb.collection(superusersCollectionName).delete(record.id);
  }

  superuserPb.authStore.clear();
  userPb.authStore.clear();
}
