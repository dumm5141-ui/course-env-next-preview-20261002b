import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { ParkingService } from "./src/parking.ts";

const service = new ParkingService({ allocate: () => "A-1" }, { save: (ticket) => ticket });
createServer((request, response) => {
  if (request.url === "/api/parking") {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(service.park({ plate: "LEARNER" })) ?? "null");
  } else {
    response.setHeader("Content-Type", "text/html");
    response.end(readFileSync("web/index.html"));
  }
}).listen(8080, "0.0.0.0", () => console.log("Parking service ready"));
