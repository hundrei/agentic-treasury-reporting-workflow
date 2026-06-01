export const baseDataset = {
  cashBalances: [
    { bank: 'Hausbank Nord', amountEur: 1180000, reservedEur: 180000 },
    { bank: 'Global Bank', amountEur: 520000, reservedEur: 50000 },
    { bank: 'West Finance Bank', amountEur: 340000, reservedEur: 30000 },
  ],
  forecastWeeks: [
    { week: '2026-06-01', inflows: 260000, outflows: 190000 },
    { week: '2026-06-08', inflows: 230000, outflows: 310000 },
    { week: '2026-06-15', inflows: 180000, outflows: 220000 },
    { week: '2026-06-22', inflows: 420000, outflows: 150000 },
  ],
  priorForecastWeeks: [
    { week: '2026-06-01', closingCash: 2260000 },
    { week: '2026-06-08', closingCash: 2180000 },
    { week: '2026-06-15', closingCash: 2130000 },
    { week: '2026-06-22', closingCash: 2380000 },
  ],
};

export const stressDataset = {
  cashBalances: [
    { bank: 'Hausbank Nord', amountEur: 980000, reservedEur: 160000 },
    { bank: 'Global Bank', amountEur: 410000, reservedEur: 30000 },
  ],
  forecastWeeks: [
    { week: '2026-06-01', inflows: 240000, outflows: 190000 },
    { week: '2026-06-08', inflows: 120000, outflows: 410000 },
    { week: '2026-06-15', inflows: 90000, outflows: 360000 },
  ],
  priorForecastWeeks: [
    { week: '2026-06-01', closingCash: 1420000 },
    { week: '2026-06-08', closingCash: 1340000 },
    { week: '2026-06-15', closingCash: 1210000 },
  ],
};
