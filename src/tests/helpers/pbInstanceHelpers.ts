import { PocketBase } from "../../config/pocketbaseConfig";
import { parsedEnv } from "./testEnvHelpers";

export const createNewPbInstance = () => new PocketBase(parsedEnv.TEST_DB_URL);
