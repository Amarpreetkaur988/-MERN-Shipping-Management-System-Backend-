const addBooking = (data) => {
    return {
      title: "Walker booking",
      body: `${data.name} has an booking with you on ${data.date} at ${data.time}`,
      booking_type: "booking",
    };
  };
  
  const bookingCancel = (data) => {
    return {
      title: "Booking cancelled",
      body: `Your booking with ${data.name} scheduled on ${data.date} at ${data.time} is cancelled.`,
      booking_type: "booking",
    };
  };
  const bookingReject = (data) => {
    return {
      title: "Booking rejected",
      body: `Your booking with ${data.name} scheduled on ${data.date} at ${data.time} is cancelled.`,
      booking_type: "booking",
    };
  };
  const bookingAccepted = (data) => {
    return {
      title: "Booking accepted",
      body: `Your booking with ${data.name} scheduled on ${data.date} at ${data.time} is accepted, please pay the fee.`,
      booking_type: "booking",
    };
  };

  const confirmBookingByOwner = (data) => {
    return {
      title: "Booking confirmed by owner",
      body: `Your booking with ${data.name} scheduled on ${data.date} at ${data.time} is confirmed by owner, be ready.`,
      booking_type: "booking",
    };
  };
  
  module.exports = { bookingCancel, bookingReject, addBooking, bookingAccepted };
  