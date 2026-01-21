import PocketBase from "pocketbase";

const pb = new PocketBase("http://127.0.0.1:8090");

describe("PocketBase auth rules", () => {
  it("authenticates a valid user", async () => {
    const authData = await pb
      .collection("users")
      .authWithPassword("test@example.com", "password123");

    expect(authData.token).toBeDefined();
    expect(pb.authStore.isValid).toBe(true);
  });

  it("rejects invalid credentials", async () => {
    await expect(
      pb.collection("users").authWithPassword("test@example.com", "wrong-password"),
    ).rejects.toThrow();
  });
});
