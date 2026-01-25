import { testPb } from "../../config/pocketbaseConfig";

export async function clearDatabase() {
  await testPb.collection("_superusers").authWithPassword("admin@admin.com", "admin@admin.com");

  const resp = await testPb.collections.getFullList();
  const nonSuperuserCollections = resp.filter((coll) => coll.name !== "_superusers");
  for (const coll of nonSuperuserCollections) {
    await testPb.collections.truncate(coll.name);
  }
  testPb.authStore.clear();
}

export function createUserEmailPasswordData() {
  const email = `test${Math.floor(Math.random() * 10000000)}@example.com`;
  return { email, password: email };
}
