import React, { useState, useEffect } from 'react';
import { Bell, Clock, ChevronRight } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import OpportunityBanner from '../portfolio/OpportunityBanner';

/**
 * ReminderCard — single reminder item with type-based colour coding.
 *
 * @param {object} props
 * @param {object} props.reminder - Reminder data object
 */
function ReminderCard({ reminder }) {
  // Derive display info from reminder data
  const name = reminder.name || reminder.protocol || 'Lembrete';
  const type = reminder.type || 'general';

  // Colour map keyed by type substring
  const colorMap = {
    airdrop: { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.25)', text: '#A5B4FC' },
    defi: { bg: 'rgba(0,255,239,0.05)', border: 'rgba(0,255,239,0.2)', text: '#67E8F9' },
    staking: { bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.2)', text: '#FCD34D' },
    general: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', text: '#9CA3AF' },
  };

  const colorKey = Object.keys(colorMap).find((k) => type.toLowerCase().includes(k)) ?? 'general';
  const colors = colorMap[colorKey];

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:opacity-90"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: colors.text }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">{name}</p>
        {reminder.network && (
          <p className="text-xs font-medium mt-0.5" style={{ color: colors.text }}>
            {reminder.network}
          </p>
        )}
      </div>
      <Clock className="w-3.5 h-3.5 flex-shrink-0 text-text-muted" />
    </div>
  );
}

/**
 * AlertsSection — aggregates OpportunityBanner and top 3 daily reminders.
 *
 * Reads reminders from the current user's Firestore document (trackers field).
 *
 * @param {object}   props
 * @param {Function} [props.onNavigateReminders] - Navigate to full Reminders page
 */
const AlertsSection = React.memo(function AlertsSection({ onNavigateReminders }) {
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to user trackers from Firestore
  useEffect(() => {
    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data().trackers)) {
          setReminders(snap.data().trackers);
        } else {
          setReminders([]);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('[AlertsSection] Error loading reminders:', error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const topReminders = reminders.slice(0, 3);

  return (
    <section className="mb-6 animate-fade-in">
      {/* Opportunity banner reused from Portfolio */}
      <OpportunityBanner />

      {/* Reminders card */}
      <div
        className="relative overflow-hidden rounded-2xl p-5"
        style={{
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Accent line */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: '1px',
            background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.5), transparent)',
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Bell className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Lembretes do Dia</h3>
          </div>
          {onNavigateReminders && (
            <button
              onClick={onNavigateReminders}
              className="flex items-center gap-1 text-xs font-medium text-text-tertiary hover:text-cyan transition-colors outline-none focus:ring-2 focus:ring-cyan/50 rounded"
            >
              Ver todos
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : topReminders.length === 0 ? (
          <div className="py-6 text-center">
            <Bell className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-40" />
            <p className="text-sm text-text-tertiary">Nenhum lembrete ativo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topReminders.map((reminder, index) => (
              <ReminderCard key={reminder.id ?? index} reminder={reminder} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

export default AlertsSection;
