/**
 * Katalyst Kickstart Calculator
 *
 * Calculates mortgage payments and savings for the Kickstart program
 * which provides a 1% rate reduction in Year 1, up to $6,000 annual savings.
 *
 * Based on existing calculator at thekatalystteam.com/kickstart
 */

export interface KickstartInput {
  purchasePrice: number;      // Total purchase price
  downPaymentPercent: number; // Down payment as percentage (e.g., 20 for 20%)
  interestRate: number;       // Annual interest rate as percentage (e.g., 6.99)
  loanTermYears?: number;     // Loan term in years (default: 30)
}

export interface KickstartResult {
  // Loan details
  loanAmount: number;
  downPaymentDollar: number;

  // Rates
  standardRate: number;       // The input rate
  kickstartRate: number;      // Rate minus 1%

  // Monthly payments (Principal & Interest only)
  standardPayment: number;
  kickstartPayment: number;

  // Savings
  monthlySavings: number;
  annualSavings: number;      // Capped at $6,000
  annualSavingsUncapped: number; // Before cap applied
  lenderCredit: number;       // Same as annual savings (what lender pays)

  // Cap info
  savingsWasCapped: boolean;  // True if $6k cap was applied
}

const ANNUAL_SAVINGS_CAP = 6000;
const KICKSTART_RATE_REDUCTION = 1; // 1% reduction

/**
 * Calculate monthly mortgage payment (Principal & Interest)
 * Standard amortization formula
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRatePercent: number,
  years: number
): number {
  const monthlyRate = annualRatePercent / 100 / 12;
  const numPayments = years * 12;

  if (monthlyRate === 0) {
    return principal / numPayments;
  }

  return (
    principal *
    monthlyRate *
    Math.pow(1 + monthlyRate, numPayments) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
}

/**
 * Calculate all Kickstart program values
 */
export function calculateKickstart(input: KickstartInput): KickstartResult {
  const {
    purchasePrice,
    downPaymentPercent,
    interestRate,
    loanTermYears = 30,
  } = input;

  // Calculate loan details
  const downPaymentDollar = purchasePrice * (downPaymentPercent / 100);
  const loanAmount = purchasePrice - downPaymentDollar;

  // Calculate rates
  const standardRate = interestRate;
  const kickstartRate = interestRate - KICKSTART_RATE_REDUCTION;

  // Calculate monthly payments
  const standardPayment = calculateMonthlyPayment(loanAmount, standardRate, loanTermYears);
  const kickstartPayment = calculateMonthlyPayment(loanAmount, kickstartRate, loanTermYears);

  // Calculate savings
  const monthlySavings = standardPayment - kickstartPayment;
  const annualSavingsUncapped = monthlySavings * 12;

  // Apply $6,000 annual cap
  const savingsWasCapped = annualSavingsUncapped > ANNUAL_SAVINGS_CAP;
  const annualSavings = Math.min(annualSavingsUncapped, ANNUAL_SAVINGS_CAP);

  // Lender credit equals the annual savings
  const lenderCredit = annualSavings;

  return {
    loanAmount,
    downPaymentDollar,
    standardRate,
    kickstartRate,
    standardPayment,
    kickstartPayment,
    monthlySavings: savingsWasCapped ? annualSavings / 12 : monthlySavings,
    annualSavings,
    annualSavingsUncapped,
    lenderCredit,
    savingsWasCapped,
  };
}

/**
 * Format a number as currency (e.g., "$1,234")
 */
export function formatCurrency(value: number): string {
  return '$' + Math.round(value).toLocaleString('en-US');
}

/**
 * Format a rate as percentage (e.g., "6.99%")
 */
export function formatRate(value: number): string {
  return value.toFixed(2) + '%';
}
