import { PocketBase, superuserPb, userPb } from "../../config/pocketbaseConfig";
import { superusersCollectionName } from "./pocketbaseMetadata";
import { parsedEnv } from "./testEnvHelpers";
// import { exec } from "child_process";
// import { promisify } from "util";

// const execAsync = promisify(exec);

export const clearDatabase = async () => {
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
};

export const clearSpecifiedDatabase = async (p: {
  testDbUrl: string;
  testDbSuperuserEmail: string;
  testDbSuperuserPassword: string;
}) => {
  const pb = new PocketBase(p.testDbUrl);
  await pb
    .collection(superusersCollectionName)
    .authWithPassword(p.testDbSuperuserEmail, p.testDbSuperuserPassword);

  const collections = await pb.collections.getFullList();
  const truncationPromises = collections
    .filter((coll) => coll.name !== superusersCollectionName)
    .map((coll) => pb.collections.truncate(coll.name));
  await Promise.all(truncationPromises);

  const superuserRecords = await pb.collection(superusersCollectionName).getFullList();
  const deleteSuperuserPromises = superuserRecords
    .filter((record) => record.email !== p.testDbSuperuserEmail)
    .map((record) => pb.collection(superusersCollectionName).delete(record.id));
  await Promise.all(deleteSuperuserPromises);

  pb.authStore.clear();
  userPb.authStore.clear();
};
