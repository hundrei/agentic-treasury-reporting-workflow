const euro = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

function formatPlainEuro(value) {
  return euro.format(value).replace(/\s/g, ' ');
}

function sum(items, selector) {
  return items.reduce((total, item) => total + selector(item), 0);
}

function hasMissingValue(value) {
  return value === null || value === undefined || Number.isNaN(value);
}

function buildForecast(dataset) {
  const openingCash = sum(dataset.cashBalances, (item) => item.amountEur);
  let closingCash = openingCash;

  return dataset.forecastWeeks.map((week) => {
    closingCash += (week.inflows ?? 0) - (week.outflows ?? 0);
    return {
      week: week.week,
      inflows: week.inflows ?? 0,
      outflows: week.outflows ?? 0,
      closingCash,
    };
  });
}

export function runDataCheckAgent(dataset) {
  const findings = [];

  const missingForecastValues = dataset.forecastWeeks.filter(
    (week) => hasMissingValue(week.inflows) || hasMissingValue(week.outflows),
  );

  if (missingForecastValues.length > 0) {
    findings.push({
      severity: 'warning',
      title: 'Forecast enthält fehlende Werte',
      detail: `${missingForecastValues.length} Woche(n) benötigen fachliche Prüfung vor Veröffentlichung.`,
    });
  }

  const negativeBalances = dataset.cashBalances.filter((balance) => balance.amountEur < 0);
  if (negativeBalances.length > 0) {
    findings.push({
      severity: 'risk',
      title: 'Negative Bankbestände prüfen',
      detail: `${negativeBalances.length} Konto/Konten weisen negative Werte auf.`,
    });
  }

  if (dataset.forecastWeeks.length < 3) {
    findings.push({
      severity: 'warning',
      title: 'Forecast-Horizont zu kurz',
      detail: 'Für ein Management Reporting sollten mindestens drei Wochen vorhanden sein.',
    });
  }

  return {
    agent: 'Data Check Agent',
    status: findings.length > 0 ? 'review' : 'passed',
    findings: findings.length > 0 ? findings : [{
      severity: 'ok',
      title: 'Datenbasis vollständig',
      detail: 'Cash Balances und Forecast-Wochen sind für die Konzeptdemo plausibel befüllt.',
    }],
  };
}

export function runKpiAgent(dataset, dataCheck) {
  const totalLiquidity = sum(dataset.cashBalances, (item) => item.amountEur);
  const reservedLiquidity = sum(dataset.cashBalances, (item) => item.reservedEur);
  const availableLiquidity = totalLiquidity - reservedLiquidity;
  const forecast = buildForecast(dataset);
  const netCashFlow = sum(dataset.forecastWeeks, (week) => (week.inflows ?? 0) - (week.outflows ?? 0));
  const finalCash = forecast.at(-1).closingCash;
  const variances = forecast.map((week, index) => (
    week.closingCash - dataset.priorForecastWeeks[index].closingCash
  ));
  const largestVariance = Math.min(...variances);

  return {
    agent: 'KPI Agent',
    status: dataCheck.status === 'passed' ? 'passed' : 'review',
    totalLiquidity,
    reservedLiquidity,
    availableLiquidity,
    netCashFlow,
    finalCash,
    largestVariance,
    forecast,
  };
}

export function runInsightAgent(kpis, dataCheck) {
  const insights = [];

  if (kpis.netCashFlow < 0) {
    insights.push({
      severity: 'risk',
      title: 'Liquiditätsabfluss priorisieren',
      detail: `Der kumulierte Netto-Cashflow liegt bei ${formatPlainEuro(kpis.netCashFlow)}.`,
    });
  }

  if (kpis.largestVariance < -100000) {
    insights.push({
      severity: 'warning',
      title: 'Forecast-Abweichung erklären',
      detail: `Die stärkste Abweichung zur Vorplanung beträgt ${formatPlainEuro(kpis.largestVariance)}.`,
    });
  }

  if (dataCheck.status !== 'passed') {
    insights.push({
      severity: 'warning',
      title: 'Datenqualität vor Versand prüfen',
      detail: 'Mindestens ein Datenqualitäts-Hinweis verlangt Human Review.',
    });
  }

  insights.push({
    severity: 'action',
    title: 'Management-Kommentar vorbereiten',
    detail: 'Report Agent erstellt eine kurze Summary, die fachlich freigegeben werden muss.',
  });

  return insights;
}

export function runReportAgent(kpis, insights, scenarioName) {
  const requiresHumanReview = insights.some((insight) => insight.severity !== 'action');
  return {
    agent: 'Report Agent',
    status: requiresHumanReview ? 'review' : 'drafted',
    requiresHumanReview,
    summary: `${scenarioName}: Die verfügbare Liquidität beträgt ${formatPlainEuro(kpis.availableLiquidity)}. Der Forecast-Endbestand liegt bei ${formatPlainEuro(kpis.finalCash)}. Die größte Abweichung zur Vorplanung beträgt ${formatPlainEuro(kpis.largestVariance)}. Empfehlung: Management-Kommentar prüfen und erst nach Human Review veröffentlichen.`,
  };
}

function step(agent, status, title, detail) {
  return { agent, status, title, detail };
}

export function runReportingWorkflow(dataset, scenarioName = 'Basis Review') {
  const dataCheck = runDataCheckAgent(dataset);
  const kpis = runKpiAgent(dataset, dataCheck);
  const insights = runInsightAgent(kpis, dataCheck);
  const report = runReportAgent(kpis, insights, scenarioName);

  return {
    scenarioName,
    status: report.requiresHumanReview ? 'review-required' : 'draft-ready',
    dataCheck,
    kpis,
    insights,
    report,
    humanReview: {
      decision: 'pending',
      note: 'Human-in-the-loop: Vorschläge fachlich prüfen, bevor sie in ein Management Reporting übernommen werden.',
    },
    steps: [
      step('Data Check Agent', dataCheck.status, 'Datenqualität prüfen', dataCheck.findings[0].detail),
      step('KPI Agent', kpis.status, 'KPIs und Forecast berechnen', `Endbestand: ${formatPlainEuro(kpis.finalCash)}`),
      step('Insight Agent', 'passed', 'Risiken priorisieren', `${insights.length} Hinweise erzeugt.`),
      step('Report Agent', report.status, 'Management Summary entwerfen', report.summary),
      step('Human Review', 'pending', 'Fachliche Freigabe einholen', 'Keine autonome Veröffentlichung.'),
    ],
  };
}

export function updateHumanReview(workflow, decision, note) {
  return {
    ...workflow,
    status: decision,
    humanReview: {
      decision,
      note,
    },
    steps: workflow.steps.map((item) => (
      item.agent === 'Human Review'
        ? { ...item, status: decision, detail: note }
        : item
    )),
  };
}
