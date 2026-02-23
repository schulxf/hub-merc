import React, { useState, useCallback, useMemo } from 'react';
import { Bell, Trash2, List, Calendar as CalendarIcon, Clock, Edit2, X } from 'lucide-react';
import { storage } from '../lib/utils';

const RemindersPage = () => {
  const [reminders, setReminders] = useState(() => storage.getArray('mercurius_reminders'));
  const [editingTracker, setEditingTracker] = useState(null);
  const [editForm, setEditForm] = useState({ capital: 0, costs: 0, points: 0, txs: 0, streak: 0 });
  const [viewTab, setViewTab] = useState('list');

  const persist = useCallback((updated) => {
    setReminders(updated);
    storage.set('mercurius_reminders', updated);
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

  const groupedReminders = useMemo(() => {
    const sorted = [...reminders].sort((a, b) => new Date(a.date) - new Date(b.date));
    return sorted.reduce((groups, rem) => {
      const d = new Date(rem.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
      (groups[d] = groups[d] || []).push(rem);
      return groups;
    }, {});
  }, [reminders]);

  return (
    <div className="animate-in fade-in pb-24 md:pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Trackers de Farming</h1>
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

      {reminders.length === 0 ? (
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
                    <span>Próx: <strong className="text-gray-200">{new Date(rem.date).toLocaleDateString()}</strong></span>
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
        <div className="relative border-l border-gray-800 ml-3 md:ml-6 space-y-8 py-4">
          {Object.entries(groupedReminders).map(([dateLabel, items]) => (
            <div key={dateLabel} className="relative pl-8 md:pl-12">
              <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              <h3 className="text-base font-bold text-white capitalize mb-4">{dateLabel}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <div key={item.id} className="bg-[#111] border border-gray-800 rounded-xl p-4 flex justify-between items-center hover:border-gray-700 transition-colors">
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">{item.type}</p>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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
                  {[{ key: 'txs', label: 'Txs Realizadas', type: 'number' }, { key: 'streak', label: 'Streak (Dias)', type: 'number' }].map(({ key, label }) => (
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