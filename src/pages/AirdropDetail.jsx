import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, Circle, ExternalLink, AlertTriangle, ChevronDown, ChevronUp, Clock, Bell, Calendar as CalendarIcon, Loader2 } from 'lucide-react';

// ============================================================================
// INSTRUÇÕES PARA O VS CODE LOCAL:
// 1. DESCOMENTE as importações abaixo para ligar aos seus ficheiros reais:
import { storage } from '../lib/utils';
import { ExternalBtn, MockPage } from '../components/ui/Shared';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

const CustomPerpdexGuide = ({ airdrop, onBack }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-24 md:pb-12">
    <button onClick={onBack} className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors outline-none focus:ring-2 focus:ring-blue-500 ">
      ← Voltar para o Hub
    </button>
    <div className="bg-[#111] border border-gray-800 rounded-2xl p-8 mb-8">
      <h1 className="text-3xl font-bold text-white mb-4">Guia Avançado: {airdrop.name}</h1>
      <p className="text-gray-400 mb-6">{airdrop.description}</p>
      <div className="border border-blue-500/20 bg-blue-500/5 p-6 rounded-xl">
        <AlertTriangle className="w-6 h-6 text-blue-400 mb-4" />
        <h3 className="text-blue-400 font-bold mb-2">Atenção ao Risco</h3>
        <p className="text-sm text-blue-200/70">
          Este é um exemplo de layout customizado. Se o airdrop for de uma Perpdex, você pode estruturar esta página como quiser.
        </p>
      </div>
    </div>
  </div>
);

const StandardAirdropGuide = ({ airdrop, onBack }) => {
  // O estado agora começa vazio e é preenchido pelo Firebase
  const [completedTasks, setCompletedTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  
  const [expandedPhase, setExpandedPhase] = useState('phase1');
  const [savedInternal, setSavedInternal] = useState(false);
  const savedTimer = useRef(null);

  // 1. BUSCAR O PROGRESSO NA NUVEM AO ABRIR A PÁGINA
  useEffect(() => {
    if (!auth.currentUser || !airdrop?.id) {
      setIsLoadingTasks(false);
      return;
    }

    setIsLoadingTasks(true);
    // Aponta para: users/{uid}/airdrops_progress/{nome-do-airdrop}
    const docRef = doc(db, 'users', auth.currentUser.uid, 'airdrops_progress', airdrop.id);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCompletedTasks(data.completedTasks || []);
      } else {
        setCompletedTasks([]);
      }
      setIsLoadingTasks(false);
    }, (error) => {
      console.error("Erro ao carregar progresso:", error);
      setIsLoadingTasks(false);
    });

    return () => unsubscribe();
  }, [airdrop?.id]);

  useEffect(() => () => clearTimeout(savedTimer.current), []);

  if (!airdrop.steps || airdrop.steps.length === 0) {
    return <MockPage title={`Guia ${airdrop.name}`} />;
  }

  const totalTasks = airdrop.steps.reduce((acc, p) => acc + p.tasks.length, 0);
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // 2. GRAVAR NA NUVEM QUANDO CLICA NO BOTÃO "MARCAR FEITO"
  const toggleTask = useCallback(async (taskId) => {
    if (!auth.currentUser) return;

    // Atualização otimista (Muda o ecrã imediatamente para não haver lag)
    const newTasks = completedTasks.includes(taskId)
      ? completedTasks.filter((id) => id !== taskId)
      : [...completedTasks, taskId];
      
    setCompletedTasks(newTasks);

    // Grava no Firebase em plano de fundo
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid, 'airdrops_progress', airdrop.id);
      await setDoc(docRef, {
        completedTasks: newTasks,
        updatedAt: new Date().toISOString()
      }, { merge: true }); // O merge=true garante que não apaga outros campos (ex: trackers) se existirem
    } catch (error) {
      console.error("Erro ao guardar tarefa:", error);
    }
  }, [completedTasks, airdrop.id]);

  const togglePhase = useCallback((phaseId) => {
    setExpandedPhase((prev) => (prev === phaseId ? null : phaseId));
  }, []);

  const handleSetReminder = useCallback(() => {
    const saved = storage.getArray('mercurius_reminders');
    if (!saved.find((r) => r.title === airdrop.name)) {
      const newReminder = {
        id: Date.now(),
        title: airdrop.name,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: airdrop.type,
      };
      storage.set('mercurius_reminders', [...saved, newReminder]);
    }
    setSavedInternal(true);
    savedTimer.current = setTimeout(() => setSavedInternal(false), 2500);
  }, [airdrop]);

  const handleGoogleCalendar = useCallback(() => {
    const text = encodeURIComponent(`Interagir com ${airdrop.name}`);
    const details = encodeURIComponent(`Lembrete semanal para farmar o airdrop da ${airdrop.name}. Guia completo no Mercurius Hub.`);
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const ds = d.toISOString().replace(/-|:|\.\d{3}/g, '');
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&dates=${ds}/${ds}&recur=RRULE:FREQ=WEEKLY`,
      '_blank'
    );
  }, [airdrop.name]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-24 md:pb-12">
      <button onClick={onBack} className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors outline-none focus:ring-2 focus:ring-blue-500 ">
        ← Voltar para o Hub
      </button>

      <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 md:p-8 mb-6 relative overflow-hidden shadow-xl">
        <div className="relative z-10 w-full">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-gray-800/80 border border-gray-700 px-3 py-1 rounded-full text-xs font-semibold text-gray-300 uppercase tracking-wider">
              {airdrop.type}
            </span>
            <span className="bg-gray-800/80 border border-gray-700 px-3 py-1 rounded-full text-xs font-semibold text-gray-300 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {airdrop.time}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-3">{airdrop.name}</h1>
          <p className="text-gray-400 max-w-2xl leading-relaxed">{airdrop.description}</p>
        </div>
      </div>

      <div className="mb-6 bg-[#111] border border-gray-800 rounded-xl p-5 md:p-6 shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-white">Progresso</h3>
            {isLoadingTasks ? (
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            ) : (
              <span
                className="font-mono text-sm font-bold bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700"
                style={{ color: airdrop.accent || '#3B82F6' }}
              >
                {progressPercentage}%
              </span>
            )}
          </div>
          <div className="flex items-center flex-wrap gap-2 text-xs font-medium w-full md:w-auto">
            <span className="text-gray-500 mr-1 hidden sm:inline">Constância:</span>
            <button
              onClick={handleSetReminder}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 transition-colors px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 select-none  ${
                savedInternal
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-gray-900/50 hover:bg-gray-800 border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {savedInternal ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Bell className="w-4 h-4" />}
              <span>{savedInternal ? 'Salvo no Tracker' : 'Tracker Interno'}</span>
            </button>
            <button
              onClick={handleGoogleCalendar}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 transition-colors bg-gray-900/50 hover:bg-gray-800 px-3 py-2 rounded-lg border border-gray-800 text-gray-400 hover:text-white outline-none focus:ring-2 focus:ring-blue-500 select-none "
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Google Agenda</span>
            </button>
          </div>
        </div>
        <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-800">
          <div
            className="h-full transition-all duration-500 ease-out shadow-lg"
            style={{ width: `${progressPercentage}%`, backgroundColor: airdrop.accent || '#3B82F6' }}
          ></div>
        </div>
      </div>

      <div className="space-y-3">
        {airdrop.steps.map((phase) => {
          const isExpanded = expandedPhase === phase.id;
          const phaseTasksDone = phase.tasks.filter((t) => completedTasks.includes(t.id)).length;
          const isPhaseComplete = phaseTasksDone === phase.tasks.length && phase.tasks.length > 0;

          return (
            <div key={phase.id} className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden transition-all duration-200">
              <button
                onClick={() => togglePhase(phase.id)}
                className="w-full px-5 py-4 flex items-center justify-between bg-[#151515] hover:bg-[#1a1a1a] transition-colors text-left outline-none focus:ring-2 focus:ring-blue-500 select-none "
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-lg ${isPhaseComplete ? 'text-black' : 'text-gray-400 bg-gray-800'}`}
                    style={{ backgroundColor: isPhaseComplete ? (airdrop.accent || '#3B82F6') : undefined }}
                  >
                    {isPhaseComplete ? <CheckCircle2 className="w-5 h-5" /> : (phase.icon || <Circle className="w-5 h-5" />)}
                  </div>
                  <h3 className={`text-base font-bold ${isPhaseComplete ? 'text-gray-500 line-through decoration-gray-600' : 'text-white'}`}>
                    {phase.title}
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono text-gray-500">{phaseTasksDone}/{phase.tasks.length}</span>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 md:p-6 border-t border-gray-800 space-y-4 bg-[#0a0a0a]">
                  <p className="text-sm text-gray-400 mb-4">{phase.description}</p>
                  
                  {isLoadingTasks ? (
                     <div className="flex justify-center py-6">
                        <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
                     </div>
                  ) : (
                    phase.tasks.map((task) => {
                      const isTaskDone = completedTasks.includes(task.id);
                      return (
                        <div
                          key={task.id}
                          className={`p-4 md:p-5 rounded-xl border ${isTaskDone ? 'bg-white/5 border-white/10' : 'bg-[#111] border-gray-800'} transition-all`}
                        >
                          <div className="flex flex-col sm:flex-row gap-5 justify-between items-start sm:items-center">
                            <div className="flex-1">
                              <h4 className={`text-sm font-bold ${isTaskDone ? 'text-gray-400' : 'text-white'}`}>{task.title}</h4>
                              <p className="text-sm text-gray-400 mt-1 leading-relaxed">{task.desc}</p>
                              {task.subLinks && (
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {task.subLinks.map((sub, idx) => (
                                    <a
                                      key={idx}
                                      href={sub.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs flex items-center justify-between px-3 py-2 bg-[#0A0A0A] hover:bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors group outline-none focus:ring-2 focus:ring-blue-500 "
                                    >
                                      <span className="truncate pr-2">{sub.name}</span>
                                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-gray-600 group-hover:text-white" />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-row sm:flex-col items-center sm:items-stretch gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                              {task.link && <ExternalBtn href={task.link}>Acessar</ExternalBtn>}
                              <button
                                onClick={() => toggleTask(task.id)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors border outline-none focus:ring-2 focus:ring-blue-500 select-none  ${
                                  isTaskDone
                                    ? 'text-black border-transparent hover:opacity-80'
                                    : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400 hover:text-white'
                                }`}
                                style={{ backgroundColor: isTaskDone ? (airdrop.accent || '#3B82F6') : undefined }}
                              >
                                {isTaskDone ? (
                                  <><CheckCircle2 className="w-3.5 h-3.5" /> Concluído</>
                                ) : (
                                  <><Circle className="w-3.5 h-3.5" /> Marcar Feito</>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {airdrop.videoUrl && (
        <div className="mt-8 bg-[#111] border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-red-500/20 p-2 rounded-lg">
              <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.86-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Guia em Vídeo</h3>
              <p className="text-sm text-gray-400">Acompanhe o passo a passo visual destas interações.</p>
            </div>
          </div>
          <div className="relative w-full overflow-hidden rounded-xl border border-gray-800 bg-[#0a0a0a]" style={{ paddingTop: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={airdrop.videoUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

// Como você tem mockDb para testes locais, passo um mock simples para a pré-visualização não estoirar
const AirdropRouter = ({ airdrop = { id: 'mock', name: 'Mock Airdrop', steps: [] }, onBack }) => {
  if (airdrop.layout === 'custom') return <CustomPerpdexGuide airdrop={airdrop} onBack={onBack} />;
  return <StandardAirdropGuide airdrop={airdrop} onBack={onBack} />;
};

export default AirdropRouter;