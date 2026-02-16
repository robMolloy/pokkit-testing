import type { PocketBase } from "../../config/pocketbaseConfig";

export function createUserEmailPasswordData() {
  const email = `test${Math.floor(Math.random() * 10000000)}@example.com`;
  return { email, password: email };
}
export const createRandomEmailAddress = () =>
  `test${Math.floor(Math.random() * 10000000)}@example.com`;

export const createUserRecord = (p: { pb: PocketBase }) => {
  const userData = createUserEmailPasswordData();
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
  forCreateFilledIn: () => createUserEmailPasswordData(),
};
