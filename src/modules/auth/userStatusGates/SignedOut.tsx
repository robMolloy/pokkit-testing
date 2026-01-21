import { useCurrentUserStore } from "../authDataStore";

export const SignedOut = (p: { children: React.ReactNode }) => {
  const currentUserStore = useCurrentUserStore();
  if (currentUserStore.data.authStatus === "loggedOut") return p.children;
};
