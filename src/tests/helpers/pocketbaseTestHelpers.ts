import { superuserPb } from "../../config/pocketbaseConfig";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function clearDatabase() {
  await superuserPb
    .collection("_superusers")
    .authWithPassword("admin@admin.com", "admin@admin.com");

  const collections = await superuserPb.collections.getFullList();
  const nonSuperuserCollections = collections.filter((coll) => coll.name !== "_superusers");
  for (const coll of nonSuperuserCollections) {
    await superuserPb.collections.truncate(coll.name);
  }

  superuserPb.authStore.clear();

  await execAsync(
    "./pocketbase/test-db/pocketbase superuser upsert admin@admin.com admin@admin.com",
  );
}
