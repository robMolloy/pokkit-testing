import PocketBase from "pocketbase";
export { PocketBase };
export type { RecordModel, RecordSubscription } from "pocketbase";
import { parsedEnv } from "../tests/helpers/testEnvHelpers";

export const userPb = new PocketBase(parsedEnv?.TEST_DB_URL);

// no difference between userPb and superuserPb - just enforces naming convention consistency
export const superuserPb = new PocketBase(parsedEnv?.TEST_DB_URL);
