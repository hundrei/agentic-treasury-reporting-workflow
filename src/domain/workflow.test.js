import { describe, expect, it } from 'vitest';
import {
  runDataCheckAgent,
  runInsightAgent,
  runKpiAgent,
  runReportingWorkflow,
  runReportAgent,
  updateHumanReview,
} from './workflow';

const dataset = {
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

describe('agentic treasury reporting workflow', () => {
  it('data check agent flags missing or risky input data', () => {
    const checked = runDataCheckAgent({
      ...dataset,
      forecastWeeks: [...dataset.forecastWeeks, { week: '2026-06-22', inflows: null, outflows: 100000 }],
    });

    expect(checked.status).toBe('review');
    expect(checked.findings.some((finding) => finding.title.includes('fehlende Werte'))).toBe(true);
  });

  it('kpi agent calculates liquidity, forecast and variance', () => {
    const dataCheck = runDataCheckAgent(dataset);
    const kpis = runKpiAgent(dataset, dataCheck);

    expect(kpis.totalLiquidity).toBe(1390000);
    expect(kpis.availableLiquidity).toBe(1200000);
    expect(kpis.netCashFlow).toBe(-510000);
    expect(kpis.finalCash).toBe(880000);
    expect(kpis.largestVariance).toBe(-330000);
  });

  it('insight and report agents create reviewable management output', () => {
    const dataCheck = runDataCheckAgent(dataset);
    const kpis = runKpiAgent(dataset, dataCheck);
    const insights = runInsightAgent(kpis, dataCheck);
    const report = runReportAgent(kpis, insights, 'Stress Review');

    expect(insights[0].title).toContain('Liquiditätsabfluss');
    expect(report.summary).toContain('Stress Review');
    expect(report.summary).toContain('880.000');
    expect(report.requiresHumanReview).toBe(true);
  });

  it('runs the full workflow and supports human review decisions', () => {
    const workflow = runReportingWorkflow(dataset, 'Treasury Monatsreport');
    const reviewed = updateHumanReview(workflow, 'approved', 'Fachlich plausibel, im Monatsreport verwenden.');

    expect(workflow.steps.map((step) => step.agent)).toEqual([
      'Data Check Agent',
      'KPI Agent',
      'Insight Agent',
      'Report Agent',
      'Human Review',
    ]);
    expect(workflow.status).toBe('review-required');
    expect(reviewed.status).toBe('approved');
    expect(reviewed.humanReview.note).toContain('Monatsreport');
  });
});
