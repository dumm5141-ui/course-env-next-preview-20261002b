export class ParkingService {
  constructor(allocator, tickets) {
    this.allocator = allocator;
    this.tickets = tickets;
  }
  park(vehicle) {
    const spot = this.allocator.allocate(vehicle);
    return this.tickets.save({ vehicle, spot });
  }
}
