const EMERGENCY_FUND_PERCENTAGE = 0.1;

export function calculateEmergencyFundAmount(totalAmount: number): number {
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    return 0;
  }

  return Math.round(totalAmount * EMERGENCY_FUND_PERCENTAGE);
}
