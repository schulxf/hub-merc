import React from 'react';
import { Plus } from 'lucide-react';
import { DashboardPrimaryButton } from '../ui/DashboardButtons';

/**
 * DashboardHeader — top section of the homepage dashboard.
 *
 * Renders a greeting with the user's name and a primary CTA button
 * to add a new transaction in the portfolio page.
 *
 * @param {object}   props
 * @param {string}   props.userName - Display name of the logged-in user
 * @param {Function} [props.onAddTransaction] - Called when user clicks "Adicionar Transação"
 */
const DashboardHeader = React.memo(function DashboardHeader({ userName, onAddTransaction }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">
          {greeting}, <span className="text-cyan">{userName || 'Investidor'}</span>
        </h1>
        <p className="text-sm text-text-tertiary mt-1 font-medium">
          Aqui está um resumo do seu patrimônio hoje
        </p>
      </div>

      {/* CTA */}
      <DashboardPrimaryButton
        onClick={onAddTransaction}
        className="flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
      >
        <Plus className="w-4 h-4" />
        Adicionar Transação
      </DashboardPrimaryButton>
    </div>
  );
});

export default DashboardHeader;
