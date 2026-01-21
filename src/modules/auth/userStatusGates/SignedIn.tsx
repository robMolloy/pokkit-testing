import { useCurrentUserStore } from "../authDataStore";

export const SignedIn = (p: { children: React.ReactNode }) => {
  const currentUserStore = useCurrentUserStore();
  if (currentUserStore.data.authStatus === "loggedIn") return p.children;
};
