/**
 * Tests for PortfolioTabs component.
 *
 * Verifies that tabs render, the correct tab appears active, and clicking
 * a tab calls setActiveTab with the right id.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PortfolioTabs from '../PortfolioTabs';

// Mock GSAP (used by some components in the tree) and lucide-react icons
// to keep tests fast and focused on behaviour, not animation.
jest.mock('gsap', () => ({
  to: jest.fn(),
  from: jest.fn(),
  timeline: jest.fn(() => ({ to: jest.fn(), from: jest.fn() })),
}));

describe('PortfolioTabs', () => {
  const setActiveTab = jest.fn();

  beforeEach(() => {
    setActiveTab.mockClear();
  });

  it('renders all three tab labels', () => {
    render(<PortfolioTabs activeTab="overview" setActiveTab={setActiveTab} />);

    expect(screen.getByText('Visao Geral')).toBeInTheDocument();
    expect(screen.getByText('Gestao de Ativos')).toBeInTheDocument();
    expect(screen.getByText('Historico')).toBeInTheDocument();
  });

  it('highlights the active tab', () => {
    render(<PortfolioTabs activeTab="assets" setActiveTab={setActiveTab} />);

    // The active tab button should have the active indicator (the span at bottom)
    // We verify by checking the button with text "Gestao de Ativos" contains
    // an active indicator element (the underline span).
    const assetsButton = screen.getByRole('button', { name: /gestao de ativos/i });
    // Active button has a child span used as the underline indicator
    expect(assetsButton.querySelector('span')).toBeInTheDocument();
  });

  it('calls setActiveTab with "assets" when Gestao de Ativos is clicked', () => {
    render(<PortfolioTabs activeTab="overview" setActiveTab={setActiveTab} />);

    fireEvent.click(screen.getByRole('button', { name: /gestao de ativos/i }));
    expect(setActiveTab).toHaveBeenCalledTimes(1);
    expect(setActiveTab).toHaveBeenCalledWith('assets');
  });

  it('calls setActiveTab with "history" when Historico is clicked', () => {
    render(<PortfolioTabs activeTab="overview" setActiveTab={setActiveTab} />);

    fireEvent.click(screen.getByRole('button', { name: /historico/i }));
    expect(setActiveTab).toHaveBeenCalledWith('history');
  });

  it('calls setActiveTab with "overview" when Visao Geral is clicked', () => {
    render(<PortfolioTabs activeTab="assets" setActiveTab={setActiveTab} />);

    fireEvent.click(screen.getByRole('button', { name: /visao geral/i }));
    expect(setActiveTab).toHaveBeenCalledWith('overview');
  });

  it('renders exactly 3 tab buttons', () => {
    render(<PortfolioTabs activeTab="overview" setActiveTab={setActiveTab} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });
});
