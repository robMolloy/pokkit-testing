import { PocketBase } from "../../config/pocketbaseConfig";
import { superusersCollectionName } from "./pocketbaseMetadata";

export const clearDatabase = async (p: {
  dbUrl: string;
  dbSuperuserEmail: string;
  dbSuperuserPassword: string;
}) => {
  const superuserPb = new PocketBase(p.dbUrl);
  await superuserPb
    .collection(superusersCollectionName)
    .authWithPassword(p.dbSuperuserEmail, p.dbSuperuserPassword);

  const collections = await superuserPb.collections.getFullList();
  const truncationPromises = collections
    .filter((coll) => coll.name !== superusersCollectionName)
    .map((coll) => superuserPb.collections.truncate(coll.name));
  await Promise.all(truncationPromises);

  const superuserRecords = await superuserPb.collection(superusersCollectionName).getFullList();
  const deleteSuperuserPromises = superuserRecords
    .filter((record) => record.email !== p.dbSuperuserEmail)
    .map((record) => superuserPb.collection(superusersCollectionName).delete(record.id));
  await Promise.all(deleteSuperuserPromises);

  superuserPb.authStore.clear();
};
export const clearDatabaseWithDefaults = async (p: { dbUrl: string }) => {
  return clearDatabase({
    dbUrl: p.dbUrl,
    dbSuperuserEmail: "admin@admin.com",
    dbSuperuserPassword: "admin@admin.com",
  });
};
