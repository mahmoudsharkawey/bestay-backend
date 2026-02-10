export function calculateBookingPrice(unitPrice) {
  const deposit = unitPrice * 0.2; // 20%
  const serviceFee = unitPrice * 0.05; // 5%

  return {
    depositAmount: deposit,
    serviceFee,
    totalAmount: deposit + serviceFee,
  };
}
