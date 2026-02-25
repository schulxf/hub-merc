import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Loader2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

/** @typedef {{ id: string, title: string, date: string, type: string, relatedAirdropId: string|null, color: string }} CalendarEvent */

const EVENT_COLORS = { tge: '#EAB308', launch: '#22C55E', deadline: '#EF4444' };

const EMPTY_FORM = { title: '', date: '', type: 'tge', relatedAirdropId: '' };

/**
 * AdminAgendaTab — Tab 3 of AdminPanel.
 *
 * Manages a global calendar visible to all platform users.
 * Reads and writes from/to the Firestore 'settings/calendar_events' document.
 *
 * @param {{ onError: (msg: string) => void }} props
 */
export default function AdminAgendaTab({ onError }) {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [eventForm, setEventForm] = useState(EMPTY_FORM);
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  useEffect(() => {
    const eventsRef = doc(db, 'settings', 'calendar_events');
    const unsub = onSnapshot(
      eventsRef,
      (snap) => {
        if (snap.exists()) {
          setCalendarEvents(snap.data().events || []);
        }
      },
      () => {}
    );
    return () => unsub();
  }, []);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.date) return;
    setIsSavingEvent(true);
    try {
      const newEvent = {
        id: Date.now().toString(),
        title: eventForm.title,
        date: eventForm.date,
        type: eventForm.type,
        relatedAirdropId: eventForm.relatedAirdropId || null,
        color: EVENT_COLORS[eventForm.type] || '#EAB308',
      };
      const updated = [...calendarEvents, newEvent];
      const eventsRef = doc(db, 'settings', 'calendar_events');
      await setDoc(eventsRef, { events: updated });
      setEventForm(EMPTY_FORM);
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      onError('Erro ao salvar evento na agenda.');
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const updated = calendarEvents.filter((e) => e.id !== eventId);
      const eventsRef = doc(db, 'settings', 'calendar_events');
      await setDoc(eventsRef, { events: updated });
    } catch (error) {
      console.error('Erro ao remover evento:', error);
      onError('Erro ao remover evento.');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Add Event Form */}
      <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-4">Adicionar Evento Global</h3>
        <p className="text-sm text-gray-400 mb-6">
          Eventos adicionados aqui aparecerão no calendário de todos os usuários.
        </p>
        <form onSubmit={handleAddEvent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Título</label>
              <input
                type="text"
                required
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                placeholder="Ex: TGE Robinhood"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Data</label>
              <input
                type="date"
                required
                value={eventForm.date}
                onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Tipo</label>
              <select
                value={eventForm.type}
                onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 appearance-none"
              >
                <option value="tge">TGE</option>
                <option value="launch">Launch</option>
                <option value="deadline">Deadline</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Airdrop Relacionado (opcional)
              </label>
              <input
                type="text"
                value={eventForm.relatedAirdropId}
                onChange={(e) =>
                  setEventForm({ ...eventForm, relatedAirdropId: e.target.value })
                }
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                placeholder="Ex: robinhood"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSavingEvent}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 outline-none"
          >
            {isSavingEvent ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            Adicionar Evento
          </button>
        </form>
      </div>

      {/* Event List */}
      <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">
            Eventos Agendados ({calendarEvents.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-800/50">
          {calendarEvents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Nenhum evento global adicionado.</p>
            </div>
          ) : (
            [...calendarEvents]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: evt.color }}
                    />
                    <div>
                      <p className="font-bold text-white text-sm">{evt.title}</p>
                      <p className="text-xs text-gray-500">
                        {evt.type.toUpperCase()} &bull;{' '}
                        {new Date(evt.date + 'T12:00').toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                        {evt.relatedAirdropId ? ` \u2022 ${evt.relatedAirdropId}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(evt.id)}
                    className="text-gray-600 hover:text-red-400 p-2 transition-colors outline-none"
                    title="Remover evento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
