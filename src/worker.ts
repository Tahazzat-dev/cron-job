import { flushLogsToMongo } from "./jobs/cronLogFlusher";

require("./workers/autoCron.worker")

setInterval(async () => {
  try {
    await flushLogsToMongo();
  } catch (err) {
    console.error('[Flush Error]', err);
  }
}, 10000);
