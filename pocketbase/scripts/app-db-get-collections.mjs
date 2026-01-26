#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
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

const main = async () => {
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
