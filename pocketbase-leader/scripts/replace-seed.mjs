#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
import PocketBase from "pocketbase";
import fse from "fs-extra";

async function deleteIfExists(dirPath) {
  try {
    const exists = await fse.pathExists(dirPath);
    if (exists) await fse.remove(dirPath);

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

const backupsBasePath = "./pocketbase-leader/pb_data/backups";

const main = async () => {
  await deleteIfExists(`${backupsBasePath}/seed.zip`);
  await deleteIfExists(`${backupsBasePath}/seed.zip.attrs`);

  const pb = new PocketBase("http://127.0.0.1:8090");
  await pb.collection("_superusers").authWithPassword("admin@admin.com", "admin@admin.com");
  await pb.backups.create("seed.zip");

  await deleteIfExists(`${backupsBasePath}/seed.zip.attrs`);
};
main();
