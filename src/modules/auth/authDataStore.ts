import PocketBase from "pocketbase";
import { useEffect } from "react";
import { create } from "zustand";
import { pocketbaseAuthStoreSchema, type TAuth, type TUser } from "./dbAuthUtils";

type TState = { authStatus: "loading" | "loggedOut" } | { authStatus: "loggedIn"; user: TAuth };

export const useUnverifiedIsLoggedInStore = create<{
  data: TState;
  setData: (x: TState) => void;
}>()((set) => ({
  data: { authStatus: "loading" },
  setData: (data) => set(() => ({ data })),
}));

export const useUnverifiedIsLoggedInSync = (p: { pb: PocketBase }) => {
  const isLoggedInStore = useUnverifiedIsLoggedInStore();
  useEffect(() => {
    if (!p.pb.authStore.isValid) return isLoggedInStore.setData({ authStatus: "loggedOut" });

    const resp = pocketbaseAuthStoreSchema.safeParse(p.pb.authStore);
    isLoggedInStore.setData(
      resp.success ? { authStatus: "loggedIn", user: resp.data } : { authStatus: "loggedOut" },
    );
  }, []);

  useEffect(() => {
    p.pb.authStore.onChange(() => {
      if (!p.pb.authStore.isValid) return isLoggedInStore.setData({ authStatus: "loggedOut" });

      const resp = pocketbaseAuthStoreSchema.safeParse(p.pb.authStore);
      isLoggedInStore.setData(
        resp.success ? { authStatus: "loggedIn", user: resp.data } : { authStatus: "loggedOut" },
      );
    });
  }, []);
};

type TCurrentUserState =
  | { authStatus: "loading" | "loggedOut" }
  | { authStatus: "loggedIn"; user: TUser };

export const useCurrentUserStore = create<{
  data: TCurrentUserState;
  setData: (x: TCurrentUserState) => void;
}>()((set) => ({
  data: { authStatus: "loading" },
  setData: (data) => set(() => ({ data })),
}));
