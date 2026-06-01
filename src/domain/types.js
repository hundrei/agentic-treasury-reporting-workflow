/**
 * @typedef {Object} AgentStep
 * @property {string} agent
 * @property {'passed'|'review'|'drafted'|'pending'|'approved'|'rejected'} status
 * @property {string} title
 * @property {string} detail
 *
 * @typedef {Object} TreasuryDataset
 * @property {{bank: string, amountEur: number, reservedEur: number}[]} cashBalances
 * @property {{week: string, inflows: number|null, outflows: number|null}[]} forecastWeeks
 * @property {{week: string, closingCash: number}[]} priorForecastWeeks
 */

export {};
