/**
 * Formatting utilities are platform-shared (promoted to `@/utils` in M2.2)
 * so components outside this module can render money and rates
 * identically. Re-exported here to keep the module's import surface
 * stable for marketplace code.
 */
export {
  formatAmount,
  formatCurrency,
  formatInterest,
  formatPercentage,
  formatRate,
  formatTenure,
} from '@/utils/format';
