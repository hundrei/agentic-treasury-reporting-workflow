import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';

afterEach(() => {
  window.location.hash = '';
});

describe('Agentic Treasury Reporting Workflow app', () => {
  it('shows the workflow overview and synthetic data disclosure', () => {
    render(<App />);

    expect(screen.getByText('Agentic Treasury Reporting Workflow')).toBeInTheDocument();
    expect(screen.getByText('Alle Daten sind fiktiv. Agenten-Ausgaben werden nicht gespeichert.')).toBeInTheDocument();
    expect(screen.getByText('Data Check Agent')).toBeInTheDocument();
    expect(screen.getByText('Human Review')).toBeInTheDocument();
  });

  it('runs the stress workflow and changes report output without browser storage', () => {
    window.localStorage.clear();
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Stress-Workflow ausführen' }));

    expect(screen.getByText('Stress Review')).toBeInTheDocument();
    expect(screen.getByText(/Review erforderlich/)).toBeInTheDocument();
    expect(screen.getByText(/880\.000/)).toBeInTheDocument();
    expect(window.localStorage.length).toBe(0);
  });

  it('supports human approval in the review view', () => {
    window.location.hash = '#/review';
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Vorschlag freigeben' }));

    expect(screen.getByText('Freigegeben')).toBeInTheDocument();
    expect(screen.getByText(/Human-in-the-loop/)).toBeInTheDocument();
  });

  it('opens the agent detail route', () => {
    window.location.hash = '#/agents';
    render(<App />);

    expect(screen.getByText('Agenten-Orchestrierung')).toBeInTheDocument();
    expect(screen.getByText('KPI Agent')).toBeInTheDocument();
    expect(screen.getByText('Report Agent')).toBeInTheDocument();
  });
});
