import { NotificationRouter } from "../src/router.ts";

const router = new NotificationRouter();
const sent = [];
router.register("test", { send: (message) => sent.push(message) });
router.send("test", "hello");
if (sent.join(",") !== "hello") throw new Error("registered collaborator was not used");
console.log("PASS");
