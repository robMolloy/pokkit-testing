#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
import PocketBase from "pocketbase";
import fse from "fs-extra";

const appDbBackupsBasePath = "./pocketbase/app-db/pb_data/backups";

async function getFileAsBlobIfExists(filePath) {
  try {
    const exists = await fse.pathExists(filePath);
    if (!exists) return { success: true };

    const buffer = await fse.readFile(filePath);
    const fileName = filePath.split("/").pop();

    const blob = new File([buffer], fileName, { type: "application/zip" });

    return { success: true, blob };
  } catch (error) {
    return { success: false, error };
  }
}

const deleteSeed = async (pb, seedName) => {
  try {
    await pb.backups.delete(seedName);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

const createSeed = async (pb, seedName) => {
  try {
    await pb.backups.create(seedName);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

const uploadSeed = async (pb, blob) => {
  try {
    await pb.backups.upload({ file: blob, name: "seed.zip" });

    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

const restoreSeed = async (pb, seedName) => {
  try {
    await pb.backups.restore(seedName);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

const main = async () => {
  const appPb = new PocketBase("http://127.0.0.1:8090");
  const testPb = new PocketBase("http://127.0.0.1:8091");

  await appPb.collection("_superusers").authWithPassword("admin@admin.com", "admin@admin.com");
  await testPb.collection("_superusers").authWithPassword("admin@admin.com", "admin@admin.com");

  await deleteSeed(appPb, "seed.zip");
  await deleteSeed(testPb, "seed.zip");

  await createSeed(appPb, "seed.zip");

  const getFileAsBlobResponse = await getFileAsBlobIfExists(`${appDbBackupsBasePath}/seed.zip`);

  if (!getFileAsBlobResponse.success) {
    console.error(`test-db-restore-app-db-seed.mjs:${/*LL*/ 81}`, getFileAsBlobResponse.error);
    return;
  }

  await uploadSeed(testPb, getFileAsBlobResponse.blob);

  await restoreSeed(testPb, "seed.zip");
};
main();
