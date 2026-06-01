import { useMemo, useState } from 'react';
import { baseDataset, stressDataset } from './data/demoData';
import { runReportingWorkflow, updateHumanReview } from './domain/workflow';

const navItems = [
  { hash: '#/workflow', label: 'Workflow' },
  { hash: '#/agents', label: 'Agenten' },
  { hash: '#/review', label: 'Review' },
];

const formatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

function money(value) {
  return formatter.format(value);
}

function compactMoney(value) {
  return `${new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value / 1000000)} Mio. EUR`;
}

function readRoute() {
  const route = window.location.hash || '#/workflow';
  return ['#/workflow', '#/agents', '#/review'].includes(route) ? route : '#/workflow';
}

function statusLabel(status) {
  const labels = {
    passed: 'Geprueft',
    review: 'Review',
    drafted: 'Entwurf',
    pending: 'Ausstehend',
    approved: 'Freigegeben',
    rejected: 'Abgelehnt',
    'review-required': 'Review erforderlich',
    'draft-ready': 'Entwurf bereit',
  };
  return labels[status] || status;
}

function timelineDetail(step) {
  if (step.agent === 'KPI Agent') {
    return 'Liquiditaet, Forecast und Abweichung wurden berechnet.';
  }

  if (step.agent === 'Report Agent') {
    return 'Management Summary als freigabepflichtiger Entwurf erstellt.';
  }

  return step.detail;
}

function App() {
  const [route, setRoute] = useState(readRoute());
  const [workflow, setWorkflow] = useState(() => runReportingWorkflow(baseDataset, 'Basis Review'));

  const activeStep = useMemo(
    () => workflow.steps.find((step) => ['review', 'pending'].includes(step.status)) || workflow.steps.at(-1),
    [workflow],
  );

  function navigate(hash) {
    window.location.hash = hash;
    setRoute(hash);
  }

  function loadBaseWorkflow() {
    setWorkflow(runReportingWorkflow(baseDataset, 'Basis Review'));
  }

  function loadStressWorkflow() {
    setWorkflow(runReportingWorkflow(stressDataset, 'Stress Review'));
  }

  function approveReport() {
    setWorkflow((current) => updateHumanReview(
      current,
      'approved',
      'Human-in-the-loop: Freigegeben nach fachlicher Plausibilisierung der Cash- und Forecast-Kommentare.',
    ));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">AT</div>
        <p className="eyebrow">SAP Finance / Treasury + KI</p>
        <h1>Agentic Treasury Reporting Workflow</h1>
        <p className="sidebar-copy">
          Konzeptdemo fuer KI-gestuetzte Prozessautomatisierung im Treasury Reporting:
          Datencheck, KPI-Berechnung, Insight-Entwurf und fachliche Freigabe.
        </p>
        <nav aria-label="Hauptnavigation">
          {navItems.map((item) => (
            <button
              className={route === item.hash ? 'nav-link active' : 'nav-link'}
              key={item.hash}
              onClick={() => navigate(item.hash)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Oeffentliche Portfolio-Demo</p>
            <h2>{workflow.scenarioName}</h2>
          </div>
          <div className="actions">
            <button className="secondary-button" onClick={loadBaseWorkflow} type="button">
              Basis-Workflow laden
            </button>
            <button className="primary-button" onClick={loadStressWorkflow} type="button">
              Stress-Workflow ausführen
            </button>
          </div>
        </header>

        <div className="disclosure">
          Alle Daten sind fiktiv. Agenten-Ausgaben werden nicht gespeichert.
        </div>

        {route === '#/workflow' && (
          <WorkflowView workflow={workflow} activeStep={activeStep} />
        )}
        {route === '#/agents' && (
          <AgentsView workflow={workflow} />
        )}
        {route === '#/review' && (
          <ReviewView workflow={workflow} onApprove={approveReport} />
        )}
      </section>
    </main>
  );
}

function WorkflowView({ workflow, activeStep }) {
  return (
    <>
      <section className="hero-card">
        <div>
          <p className="eyebrow">Agentic Workflow Case Study</p>
          <h2>Human-in-the-loop Reporting statt Blackbox-Automation</h2>
          <p>
            Die Demo zeigt, wie ein Treasury-Report vorbereitet werden koennte:
            Agenten pruefen Daten, berechnen KPIs, formulieren Hinweise und stoppen vor der
            Veroeffentlichung bewusst bei der fachlichen Freigabe.
          </p>
        </div>
        <div className="status-panel">
          <span className={`status-pill ${workflow.status}`}>
            {statusLabel(workflow.status)}
          </span>
          <strong>{activeStep.agent}</strong>
          <small>{activeStep.title}</small>
        </div>
      </section>

      <KpiGrid workflow={workflow} />

      <section className="grid-two">
        <div className="card">
          <div className="section-heading">
            <p className="eyebrow">Ablauf</p>
            <h3>Agenten-Kette</h3>
          </div>
          <div className="timeline">
            {workflow.steps.map((step, index) => (
              <article className="timeline-item" key={step.agent}>
                <span>{index + 1}</span>
                <div>
                  <strong>{step.agent}</strong>
                  <p>{step.title}</p>
                  <small>{timelineDetail(step)}</small>
                </div>
                <em>{statusLabel(step.status)}</em>
              </article>
            ))}
          </div>
        </div>
        <ReportCard workflow={workflow} />
      </section>
    </>
  );
}

function KpiGrid({ workflow }) {
  const kpis = workflow.kpis;
  const cards = [
    ['Verfuegbare Liquiditaet', money(kpis.availableLiquidity), 'Bankbestand minus reservierte Mittel'],
    ['Forecast-Endbestand', compactMoney(kpis.finalCash), 'Ende des simulierten Forecast-Horizonts'],
    ['Netto-Cashflow', money(kpis.netCashFlow), 'Einzahlungen minus Auszahlungen'],
    ['Groesste Abweichung', compactMoney(kpis.largestVariance), 'Aktuelles Szenario gegen Vorplanung'],
  ];

  return (
    <section className="kpi-grid">
      {cards.map(([label, value, detail]) => (
        <article className="kpi-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
          <small>{detail}</small>
        </article>
      ))}
    </section>
  );
}

function AgentsView({ workflow }) {
  const agentDescriptions = [
    ['Data Check Agent', 'Prueft Vollstaendigkeit, negative Bankbestaende und Forecast-Horizont.'],
    ['KPI Agent', 'Berechnet Liquiditaet, Reserven, Netto-Cashflow und Forecast-Endbestand.'],
    ['Insight Agent', 'Priorisiert Abweichungen, Liquiditaetsrisiken und Datenqualitaets-Hinweise.'],
    ['Report Agent', 'Formuliert eine Management Summary als Entwurf fuer die Freigabe.'],
  ];

  return (
    <>
      <section className="hero-card compact">
        <div>
          <p className="eyebrow">Orchestrierung</p>
          <h2>Agenten-Orchestrierung</h2>
          <p>
            Jeder Schritt ist transparent ableitbar. Die Demo positioniert KI als Assistenz
            fuer Finance-Teams, nicht als autonomes Entscheidungssystem.
          </p>
        </div>
        <span className="concept-badge">KI-Konzeptdemo auf synthetischen Daten</span>
      </section>

      <section className="agent-grid">
        {agentDescriptions.map(([agent, description]) => {
          const step = workflow.steps.find((item) => item.agent === agent);
          return (
            <article className="agent-card" key={agent}>
              <div>
                <span className="agent-icon">{agent.split(' ')[0].slice(0, 2)}</span>
                <h3>{agent}</h3>
              </div>
              <p>{description}</p>
              <small>Aktueller Status: {statusLabel(step?.status || 'passed')}</small>
            </article>
          );
        })}
      </section>

      <section className="card">
        <div className="section-heading">
          <p className="eyebrow">Kontrollpunkte</p>
          <h3>Warum agentic, aber kontrolliert?</h3>
        </div>
        <ul className="clean-list">
          <li>Der Workflow kann wiederholbare Reporting-Schritte vorbereiten.</li>
          <li>Risikohinweise bleiben nachvollziehbar und werden aus synthetischen Daten abgeleitet.</li>
          <li>Die letzte Entscheidung bleibt beim Menschen: Human Review vor Management-Kommunikation.</li>
        </ul>
      </section>
    </>
  );
}

function ReviewView({ workflow, onApprove }) {
  const isApproved = workflow.humanReview.decision === 'approved';

  return (
    <section className="grid-two">
      <div className="card review-card">
        <div className="section-heading">
          <p className="eyebrow">Freigabe</p>
          <h2>{isApproved ? 'Freigegeben' : 'Review erforderlich'}</h2>
        </div>
        <p>{workflow.humanReview.note}</p>
        <button className="primary-button" onClick={onApprove} type="button">
          Vorschlag freigeben
        </button>
      </div>
      <ReportCard workflow={workflow} />
    </section>
  );
}

function ReportCard({ workflow }) {
  return (
    <article className="card report-card">
      <div className="section-heading">
        <p className="eyebrow">Report Agent</p>
        <h3>Management Summary</h3>
      </div>
      <p>{workflow.report.summary}</p>
      <div className="insight-list">
        {workflow.insights.map((insight) => (
          <div className={`insight ${insight.severity}`} key={insight.title}>
            <strong>{insight.title}</strong>
            <span>{insight.detail}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export default App;
