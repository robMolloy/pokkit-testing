import { PocketBase } from "@/modules/auth/pocketbaseTypeHelpers";

export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL);
pb.autoCancellation(false);
