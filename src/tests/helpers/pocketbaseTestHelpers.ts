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
  const email = `test${Math.random() * 10000000}@example.com`;
  return { email, password: email };
}

export async function createUserEmailPassword(email: string, password: string) {
  return await testPb.collection("users").create({
    email,
    password,
    passwordConfirm: password,
  });
}
