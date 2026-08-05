import { confirmedAccommodationBookings } from "./confirmedAccommodationBookings";

// A public-safe, derived timeline. Presentation decides whether a device may
// reveal the booking summary or private stay details.
const bookings = Object.values(confirmedAccommodationBookings);

export function confirmedStayTransitionsOn(date) {
  return bookings.flatMap((booking) => {
    if (booking.checkIn === date) return [{ booking, phase: "check-in" }];
    if (booking.checkOut === date) return [{ booking, phase: "check-out" }];
    if (booking.checkIn < date && date < booking.checkOut) return [{ booking, phase: "overnight" }];
    return [];
  }).sort((left, right) => {
    const phaseOrder = { "check-out": 0, "check-in": 1, overnight: 2 };
    return phaseOrder[left.phase] - phaseOrder[right.phase];
  });
}
