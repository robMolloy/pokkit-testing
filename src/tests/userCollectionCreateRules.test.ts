import { beforeEach, describe, expect, it } from "vitest";
import { userPb } from "../config/pocketbaseConfig";
import { usersCollectionName } from "./helpers/pocketbaseMetadata";
import { clearDatabase } from "./helpers/pocketbaseTestHelpers";
import { createUserEmailPasswordData } from "./helpers/pocketbaseUserHelpers";

// NO RULES - IT'S A FREE FOR ALL!!!
//

describe(`PocketBase user collection view rules as standard user`, () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("allows logged out user to create record", async () => {
    const userData = createUserEmailPasswordData();
    // validated by no errors being thrown
    const createResp = await userPb.collection(usersCollectionName).create({
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.password,
    });

    // validated by logging user in - not strictly necessary
    await userPb
      .collection(usersCollectionName)
      .authWithPassword(userData.email, userData.password);

    const loggedInUserRecord = await userPb.collection(usersCollectionName).getOne(createResp.id);
    expect(loggedInUserRecord.id).toBe(createResp.id);
  });
});
