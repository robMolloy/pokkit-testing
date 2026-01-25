import PocketBase from "pocketbase";
export { PocketBase };
export type { RecordModel, RecordSubscription } from "pocketbase";

export const appPb = new PocketBase(import.meta.env.VITE_POCKETBASE_APP_DB_URL);
export const testPb = new PocketBase(import.meta.env.VITE_POCKETBASE_TEST_DB_URL);
