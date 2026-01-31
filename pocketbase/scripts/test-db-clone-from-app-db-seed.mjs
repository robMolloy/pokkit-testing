#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
import "dotenv/config";
import PocketBase from "pocketbase";
import fse from "fs-extra";

const getCollections = async (pb) => {
  try {
    const data = await pb.collections.getFullList();
    return { success: true, data };
  } catch (error) {
    return { success: false };
  }
};

async function writeText(filePath, text) {
  try {
    await fse.writeFile(filePath, text, "utf8");
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}

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
  const appPb = new PocketBase(process.env.VITE_POCKETBASE_APP_DB_URL);
  const testPb = new PocketBase(process.env.TEST_DB_URL);

  await appPb
    .collection("_superusers")
    .authWithPassword(process.env.TEST_DB_USERNAME, process.env.TEST_DB_PASSWORD);
  await testPb
    .collection("_superusers")
    .authWithPassword(process.env.TEST_DB_USERNAME, process.env.TEST_DB_PASSWORD);

  await deleteSeed(appPb, process.env.TEST_SEED_FILE_NAME);
  await deleteSeed(testPb, process.env.TEST_SEED_FILE_NAME);

  await createSeed(appPb, process.env.TEST_SEED_FILE_NAME);

  const getFileAsBlobResponse = await getFileAsBlobIfExists(
    `${appDbBackupsBasePath}/${process.env.TEST_SEED_FILE_NAME}`,
  );

  if (!getFileAsBlobResponse.success) {
    console.error(`test-db-restore-app-db-seed.mjs:${/*LL*/ 81}`, getFileAsBlobResponse.error);
    return;
  }

  await uploadSeed(testPb, getFileAsBlobResponse.blob);

  await restoreSeed(testPb, process.env.TEST_SEED_FILE_NAME);

  const pb = new PocketBase("http://127.0.0.1:8090");
  await pb.collection("_superusers").authWithPassword("admin@admin.com", "admin@admin.com");

  const resp = await getCollections(pb);
  if (!resp.success) {
    console.log("Error getting collections");
    return;
  }
  const collectionsString = JSON.stringify(resp.data, undefined, 2);

  const filePath = "./pocketbase/app-db/collections.json";
  writeText(filePath, collectionsString);
};
main();
