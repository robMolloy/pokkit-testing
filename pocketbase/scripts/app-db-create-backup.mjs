#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
import PocketBase from "pocketbase";

const main = async () => {
  const pb = new PocketBase("http://127.0.0.1:8090");

  await pb.collection("_superusers").authWithPassword("admin@admin.com", "admin@admin.com");
  await pb.backups.create();
};
main();
