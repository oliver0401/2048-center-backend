import { Runware } from "@runware/sdk-js";
import { Env } from "../env";

export const runware = new Runware({
    apiKey: Env.runwareApiKey,
    timeoutDuration: 60000,
});