import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Bell, Trash2, List, Calendar as CalendarIcon, Clock, Edit2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc, deleteField, collection } from 'firebase/firestore';
import { storage } from '../lib/utils';

const RemindersPage = () => {
  const [reminders, setReminders] = useState([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState(true);
  const [editingTracker, setEditingTracker] = useState(null);
  const [editForm, setEditForm] = useState({ capital: 0, costs: 0, points: 0, txs: 0, streak: 0 });
  const [viewTab, setViewTab] = useState('list');

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [globalEvents, setGlobalEvents] = useState([]);

  // Fetch personal reminders from Firestore (per-user)
  useEffect(() => {
    if (!auth.currentUser) {
      setReminders([]);
      setIsLoadingReminders(false);
      return;
    }

    const remindersRef = doc(db, 'users', auth.currentUser.uid, 'profile');
    const unsub = onSnapshot(remindersRef, (snap) => {
      if (snap.exists() && snap.data().trackers) {
        setReminders(snap.data().trackers || []);
      } else {
        // Fallback to empty array if no trackers exist
        setReminders([]);
      }
      setIsLoadingReminders(false);
    }, (error) => {
      console.error('Error loading reminders:', error);
      setIsLoadingReminders(false);
      // Fallback to localStorage as backup
      setReminders(storage.getArray('mercurius_reminders') || []);
    });
    return () => unsub();
  }, []);

  // Fetch global events from Firestore
  useEffect(() => {
    const eventsRef = doc(db, 'settings', 'calendar_events');
    const unsub = onSnapshot(eventsRef, (snap) => {
      if (snap.exists()) {
        setGlobalEvents(snap.data().events || []);
      }
    }, () => {
      // Silently ignore if doc doesn't exist yet
    });
    return () => unsub();
  }, []);

  const persist = useCallback(async (updated) => {
    setReminders(updated);
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid, 'profile');
      await updateDoc(userRef, { trackers: updated });
    } catch (error) {
      console.error('Error saving reminders:', error);
      // Fallback to localStorage if Firestore fails
      storage.set('mercurius_reminders', updated);
    }
  }, []);

  const removeReminder = useCallback((id) => persist(reminders.filter((r) => r.id !== id)), [reminders, persist]);

  const openEditModal = useCallback((rem) => {
    setEditingTracker(rem);
    setEditForm({
      capital: rem.capital ?? 0,
      costs: rem.costs ?? 0,
      points: rem.points ?? 0,
      txs: rem.txs ?? 0,
      streak: rem.streak ?? 0,
    });
  }, []);

  const saveTrackerUpdate = useCallback(
    (e) => {
      e.preventDefault();
      persist(
        reminders.map((r) =>
          r.id === editingTracker.id
            ? {
                ...r,
                capital: parseFloat(editForm.capital) || 0,
                costs: parseFloat(editForm.costs) || 0,
                points: parseFloat(editForm.points) || 0,
                txs: parseInt(editForm.txs) || 0,
                streak: parseInt(editForm.streak) || 0,
              }
            : r
        )
      );
      setEditingTracker(null);
    },
    [reminders, editingTracker, editForm, persist]
  );

  // Calendar utilities
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const getEventsForDay = useCallback((day) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Personal tracker reminders
    const personalEvents = reminders
      .filter(r => r.date && r.date.startsWith(dateStr))
      .map(r => ({ ...r, isGlobal: false, eventColor: r.type?.toLowerCase() === 'testnet' ? 'blue' : 'green' }));

    // Global events from Firestore
    const globalEvts = globalEvents
      .filter(e => e.date === dateStr)
      .map(e => ({ ...e, isGlobal: true, eventColor: e.type === 'tge' ? 'yellow' : e.type === 'launch' ? 'green' : 'red' }));

    return [...personalEvents, ...globalEvts];
  }, [currentMonth, reminders, globalEvents]);

  return (
    <div className="animate-in fade-in pb-24 md:pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Trackers e Agenda</h1>
          <p className="text-gray-400">Acompanhe capital, custos e sua agenda de interações.</p>
        </div>
        <div className="bg-[#111] p-1 rounded-lg border border-gray-800 flex items-center w-full md:w-auto">
          {[{ id: 'list', label: 'Lista', icon: List }, { id: 'calendar', label: 'Calendário', icon: CalendarIcon }].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setViewTab(id)}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-semibold transition-colors outline-none flex items-center justify-center gap-2 ${
                viewTab === id ? 'bg-[#1A1D24] text-white shadow' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {reminders.length === 0 && viewTab === 'list' ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-800 rounded-2xl bg-[#111]">
          <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Nenhum Tracker Ativo</h3>
          <p className="text-gray-500 text-sm">Acesse um Guia e adicione projetos aqui.</p>
        </div>
      ) : viewTab === 'list' ? (
        <div className="space-y-4">
          {reminders.map((rem) => {
            const isTestnet = rem.type?.toLowerCase() === 'testnet';
            return (
              <div key={rem.id} className="bg-[#111] border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-6 hover:border-gray-700 transition-colors shadow-sm">
                <div className="flex-shrink-0 w-full md:w-1/4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${isTestnet ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                    {rem.title[0]}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white leading-tight">{rem.title}</h4>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isTestnet ? 'text-blue-400' : 'text-green-400'}`}>{rem.type}</span>
                  </div>
                </div>

                <div className="flex-1 w-full flex items-center justify-between md:justify-around bg-[#0a0a0a] rounded-lg p-3 border border-gray-800/50">
                  {isTestnet ? (
                    <>
                      <div className="text-center px-4">
                        <p className="text-[10px] text-gray-500 uppercase">Txs Realizadas</p>
                        <p className="font-mono text-lg font-bold text-gray-200">{rem.txs ?? 0}</p>
                      </div>
                      <div className="w-px h-8 bg-gray-800" />
                      <div className="text-center px-4">
                        <p className="text-[10px] text-gray-500 uppercase">Streak</p>
                        <p className="font-mono text-lg font-bold text-white">{rem.streak ?? 0} <span className="text-xs text-gray-500">dias</span></p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center px-2">
                        <p className="text-[10px] text-gray-500 uppercase">Capital</p>
                        <p className="font-mono text-sm md:text-base font-bold text-gray-200">${(rem.capital ?? 0).toLocaleString()}</p>
                      </div>
                      <div className="w-px h-8 bg-gray-800 hidden sm:block" />
                      <div className="text-center px-2">
                        <p className="text-[10px] text-gray-500 uppercase">Taxas</p>
                        <p className="font-mono text-sm md:text-base font-bold text-red-400">-${(rem.costs ?? 0).toLocaleString()}</p>
                      </div>
                      <div className="w-px h-8 bg-gray-800 hidden sm:block" />
                      <div className="text-center px-2">
                        <p className="text-[10px] text-gray-500 uppercase">Pontos</p>
                        <p className="font-mono text-base md:text-lg font-bold text-white">{(rem.points ?? 0).toLocaleString()}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex-shrink-0 w-full md:w-auto flex items-center justify-between md:justify-end gap-4 mt-4 md:mt-0 border-t border-gray-800 md:border-t-0 pt-4 md:pt-0">
                  <div className="text-xs text-gray-400 flex items-center gap-1.5 md:hidden lg:flex">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {rem.date ? (
                      <span>Próx: <strong className="text-gray-200">{new Date(rem.date).toLocaleDateString()}</strong></span>
                    ) : (
                      <span>Próx: <strong className="text-gray-500">Sem data</strong></span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(rem)} className="text-xs flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-semibold transition-colors outline-none">
                      <Edit2 className="w-3 h-3" /> Atualizar
                    </button>
                    <button onClick={() => removeReminder(rem.id)} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-2 rounded-lg transition-colors outline-none">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========== GOOGLE CALENDAR-STYLE MONTHLY VIEW ========== */
        <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#0D0F13]">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white outline-none">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white capitalize">
              {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white outline-none">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day of week headers */}
          <div className="grid grid-cols-7 border-b border-gray-800">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="p-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells for days before first day */}
            {Array.from({ length: getFirstDayOfMonth(currentMonth) }, (_, i) => (
              <div key={`empty-${i}`} className="min-h-[90px] md:min-h-[100px] border-b border-r border-gray-800/50 bg-[#0a0a0a]/50" />
            ))}

            {/* Day cells */}
            {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => {
              const day = i + 1;
              const events = getEventsForDay(day);
              const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();

              return (
                <div key={day} className={`min-h-[90px] md:min-h-[100px] border-b border-r border-gray-800/50 p-1.5 md:p-2 ${isToday ? 'bg-blue-500/5' : ''}`}>
                  <span className={`text-xs font-bold inline-flex items-center justify-center ${isToday ? 'bg-blue-500 text-white w-6 h-6 rounded-full' : 'text-gray-400 w-6 h-6'}`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {events.slice(0, 3).map((evt, ei) => {
                      const colorMap = {
                        blue: 'bg-blue-500/20 text-blue-400',
                        green: 'bg-green-500/20 text-green-400',
                        yellow: 'bg-yellow-500/20 text-yellow-400',
                        red: 'bg-red-500/20 text-red-400',
                      };
                      return (
                        <div
                          key={ei}
                          className={`text-[9px] md:text-[10px] font-medium px-1 md:px-1.5 py-0.5 rounded truncate ${colorMap[evt.eventColor] || colorMap.blue}`}
                          title={`${evt.title}${evt.isGlobal ? ' (Global)' : ''}`}
                        >
                          {evt.isGlobal && <span className="opacity-60 mr-0.5">&#9733;</span>}
                          {evt.title}
                        </div>
                      );
                    })}
                    {events.length > 3 && (
                      <span className="text-[9px] text-gray-500 pl-1">+{events.length - 3} mais</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6 px-6 py-3 border-t border-gray-800 bg-[#0D0F13]">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-3 h-3 rounded-sm bg-blue-500/30" /> Testnet
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-3 h-3 rounded-sm bg-green-500/30" /> Mainnet
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-3 h-3 rounded-sm bg-yellow-500/30" /> TGE
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-3 h-3 rounded-sm bg-red-500/30" /> Deadline
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="opacity-60">&#9733;</span> Evento Global
            </div>
          </div>
        </div>
      )}

      {/* Edit Tracker Modal */}
      {editingTracker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-[#151515] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-[#111]">
              <h3 className="text-xl font-bold text-white">Atualizar: {editingTracker.title}</h3>
              <button onClick={() => setEditingTracker(null)} className="text-gray-400 hover:text-white outline-none" aria-label="Fechar">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={saveTrackerUpdate} className="p-6 space-y-4">
              {editingTracker.type?.toLowerCase() === 'testnet' ? (
                <>
                  {[{ key: 'txs', label: 'Txs Realizadas' }, { key: 'streak', label: 'Streak (Dias)' }].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
                      <input
                        type="number" min="0" required
                        value={editForm[key]}
                        onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { key: 'capital', label: 'Capital (USD)', border: 'focus:border-blue-500' },
                    { key: 'costs', label: 'Custos (USD)', border: 'focus:border-red-500' },
                    { key: 'points', label: 'Pontos', border: 'focus:border-green-500' },
                  ].map(({ key, label, border }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
                      <input
                        type="number" step="any" min="0" required
                        value={editForm[key]}
                        onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                        className={`w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none ${border}`}
                      />
                    </div>
                  ))}
                </>
              )}
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-500 transition-colors outline-none">
                Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemindersPage;
