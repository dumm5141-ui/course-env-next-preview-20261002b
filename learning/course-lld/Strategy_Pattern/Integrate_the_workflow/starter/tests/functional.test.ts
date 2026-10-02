import { ParkingService } from "../src/parking.ts";

const calls = [];
const allocator = {
  allocate: (_vehicle) => {
    calls.push("allocate");
    return "A-1";
  },
};
const tickets = {
  save: (ticket) => {
    calls.push("save");
    return ticket;
  },
};
const service = new ParkingService(allocator, tickets);
service.park({ plate: "TEST" });
if (calls.join(",") !== "allocate,save") throw new Error("expected independent collaborators");
console.log("PASS");
