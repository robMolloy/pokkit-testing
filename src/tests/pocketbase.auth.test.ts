import { describe, expect, it, beforeEach } from "vitest";
import { testPb } from "../config/pocketbaseConfig";

const usersCollectionName = "users";

describe("PocketBase users collection rules", () => {
  beforeEach(async () => {
    await testPb.collection("_superusers").authWithPassword("admin@admin.com", "admin@admin.com");

    const resp = await testPb.collections.getFullList();
    const nonSuperuserCollections = resp.filter((coll) => coll.name !== "_superusers");
    for (const coll of nonSuperuserCollections) {
      await testPb.collections.truncate(coll.name);
    }
    testPb.authStore.clear();
  });

  it("rejects invalid credentials", async () => {
    await expect(
      testPb.collection("users").authWithPassword("test@example.com", "wrong-password"),
    ).rejects.toThrow();
  });

  it("allows valid credentials", async () => {
    const resp = await testPb
      .collection(usersCollectionName)
      .create({
        email: `rob${Math.random() * 10000000}@rob.com`,
        password: "rob@rob.com",
        passwordConfirm: "rob@rob.com",
      });
    expect(resp.id).not.toBeNull();
  });
});
