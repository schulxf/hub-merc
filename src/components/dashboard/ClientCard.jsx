// src/components/dashboard/ClientCard.jsx
import React, { useCallback } from 'react';
import { usePrivacyMode } from '../../contexts/PrivacyContext';

/**
 * Tier badge colour map — maps tier string to Tailwind utility classes.
 *
 * @type {Record<string, string>}
 */
const TIER_STYLES = {
  free: 'bg-gray-500/10 text-gray-400',
  pro: 'bg-blue-500/10 text-blue-400',
  vip: 'bg-yellow-500/10 text-yellow-400',
  admin: 'bg-purple-500/10 text-purple-400',
};

/**
 * Tier label translations.
 *
 * @type {Record<string, string>}
 */
const TIER_LABELS = {
  free: 'Gratuito',
  pro: 'Premium',
  vip: 'VIP',
  admin: 'Admin',
};

/**
 * getAvatarLetter — returns the first character to display in the avatar circle.
 *
 * @param {string} [displayName]
 * @param {string} email
 * @returns {string}
 */
function getAvatarLetter(displayName, email) {
  const source = (displayName || email || '?').trim();
  return source[0].toUpperCase();
}

/**
 * ClientCard — renders a single client card in the assessor dashboard.
 *
 * @param {object} props
 * @param {{ uid: string, email: string, displayName?: string, tier: string, totalValue: number }} props.client
 * @param {(uid: string) => void} props.onSelect
 * @param {boolean} [props.isSelected=false]
 * @returns {React.ReactElement}
 */
const ClientCard = React.memo(function ClientCard({ client, onSelect, isSelected = false }) {
  const { formatValue } = usePrivacyMode();

  const handleClick = useCallback(() => {
    onSelect(client.uid);
  }, [onSelect, client.uid]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(client.uid);
      }
    },
    [onSelect, client.uid],
  );

  const tierStyle = TIER_STYLES[client.tier] ?? TIER_STYLES.free;
  const tierLabel = TIER_LABELS[client.tier] ?? client.tier;
  const avatarLetter = getAvatarLetter(client.displayName, client.email);
  const formattedValue = formatValue(client.totalValue ?? 0, 'usd');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`bg-[#111] border rounded-2xl p-6 cursor-pointer transition-all duration-200 outline-none focus:ring-2 focus:ring-blue-500 select-none ${
        isSelected
          ? 'border-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.12)]'
          : 'border-gray-800 hover:border-blue-500/30'
      }`}
      aria-pressed={isSelected}
      aria-label={`Selecionar cliente ${client.displayName || client.email}`}
    >
      {/* Avatar + info */}
      <div className="flex items-start gap-4">
        {/* Avatar circle */}
        <div className="w-10 h-10 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-blue-300 font-bold text-sm">{avatarLetter}</span>
        </div>

        {/* Name / email */}
        <div className="flex-1 min-w-0">
          {client.displayName && (
            <p className="text-sm font-semibold text-white leading-tight truncate">
              {client.displayName}
            </p>
          )}
          <p className={`text-xs text-gray-400 truncate ${client.displayName ? 'mt-0.5' : 'font-semibold text-white text-sm'}`}>
            {client.email}
          </p>
        </div>
      </div>

      {/* Footer: tier badge + total value */}
      <div className="mt-4 flex items-center justify-between">
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tierStyle}`}>
          {tierLabel}
        </span>
        <span className="text-sm font-mono font-bold text-white">{formattedValue}</span>
      </div>
    </div>
  );
});

export default ClientCard;
