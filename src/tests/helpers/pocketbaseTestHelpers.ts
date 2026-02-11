import { superuserPb, userPb } from "../../config/pocketbaseConfig";
import { exec } from "child_process";
import { promisify } from "util";
import { superusersCollectionName } from "./pocketbaseMetadata";
import { parsedEnv } from "./testEnvHelpers";

const execAsync = promisify(exec);

export async function clearDatabase() {
  await execAsync(
    `./pocketbase/test-db/pocketbase_${process.platform}_${process.arch}${process.platform === "win32" ? ".exe" : ""} superuser upsert ${parsedEnv.TEST_DB_USERNAME} ${parsedEnv.TEST_DB_PASSWORD}`,
  );

  await superuserPb
    .collection(superusersCollectionName)
    .authWithPassword(parsedEnv.TEST_DB_USERNAME, parsedEnv.TEST_DB_PASSWORD);

  const collections = await superuserPb.collections.getFullList();
  const truncationPromises = collections
    .filter((coll) => coll.name !== superusersCollectionName)
    .map((coll) => superuserPb.collections.truncate(coll.name));
  await Promise.all(truncationPromises);

  const superuserRecords = await superuserPb.collection(superusersCollectionName).getFullList();
  const deleteSuperuserPromises = superuserRecords
    .filter((record) => record.email !== parsedEnv.TEST_DB_USERNAME)
    .map((record) => superuserPb.collection(superusersCollectionName).delete(record.id));
  await Promise.all(deleteSuperuserPromises);

  superuserPb.authStore.clear();
  userPb.authStore.clear();
}
