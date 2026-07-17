import type { PocketBase } from "../config/pocketbaseConfig";

export const createRandomEmailAddress = () =>
  `test${Math.floor(Math.random() * 10000000)}@example.com`;

export function createRandomUserEmailPasswordData() {
  const email = createRandomEmailAddress();
  return { email, password: email };
}

export const createRandomUserRecord = (p: { pb: PocketBase }) => {
  const userData = createRandomUserEmailPasswordData();
  return p.pb.collection("users").create({
    email: userData.email,
    password: userData.password,
    passwordConfirm: userData.password,
  });
};

export const userSeedFactory = {
  forCreate: (p: { email: string; password: string }) => ({
    email: p.email,
    password: p.password,
    passwordConfirm: p.password,
  }),
  forCreateFilledIn: () => createRandomUserEmailPasswordData(),
};
