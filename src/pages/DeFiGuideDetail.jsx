import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';

const DeFiGuideDetail = ({ guideId, guide, onBack }) => {
  const [completedTasks, setCompletedTasks] = useState([]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const { profile } = useUserProfile();
  const userTier = profile?.tier || 'free';

  if (!guide) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Guia não encontrado.</p>
      </div>
    );
  }

  const tierRank = { free: 0, pro: 1, vip: 2, admin: 3 };
  const canViewGuide = tierRank[guide.targetTier] <= (tierRank[userTier] || 0);

  if (!canViewGuide) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Lock className="w-16 h-16 text-yellow-500 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-white mb-2">Guia Bloqueado</h2>
        <p className="text-gray-400 mb-6 max-w-md text-center">
          Este guia requer o tier {guide.targetTier}. Faça upgrade para aceder.
        </p>
        <a
          href="https://app.alpaclass.com/"
          target="_blank"
          rel="noreferrer"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Fazer Upgrade
        </a>
      </div>
    );
  }

  const currentPhase = guide.phases[currentPhaseIndex];
  const totalTasks = guide.phases.reduce((sum, p) => sum + p.tasks.length, 0);
  const progressPercentage = (completedTasks.length / totalTasks) * 100;

  const handleTaskToggle = (taskId) => {
    if (completedTasks.includes(taskId)) {
      setCompletedTasks(completedTasks.filter(id => id !== taskId));
    } else {
      setCompletedTasks([...completedTasks, taskId]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-8">
        <div className="flex-1">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-semibold mb-4 outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos Guias
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">{guide.title}</h1>
          <p className="text-gray-400 text-lg">{guide.subtitle}</p>
        </div>

        {/* Progress Badge */}
        <div className="bg-[#0B0D12] border border-white/[0.07] rounded-xl p-6 text-center min-w-[150px]">
          <div className="text-3xl font-bold text-cyan-400 mb-2">{Math.round(progressPercentage)}%</div>
          <p className="text-sm text-gray-400">Progresso</p>
          <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Phases */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase mb-4">Fases do Guia</p>
            {guide.phases.map((phase, idx) => (
              <button
                key={phase.id}
                onClick={() => setCurrentPhaseIndex(idx)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all outline-none ${
                  currentPhaseIndex === idx
                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                    : 'text-gray-400 hover:text-white hover:bg-[#1A1D24]'
                }`}
              >
                <div className="font-semibold text-sm">{phase.title}</div>
                <div className="text-xs opacity-75 mt-1">
                  {phase.tasks.filter(t => completedTasks.includes(t.id)).length} / {phase.tasks.length}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main: Current Phase Tasks */}
        <div className="lg:col-span-3">
          <div className="bg-[#0B0D12] border border-white/[0.07] rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">{currentPhase.title}</h2>

            <div className="space-y-4">
              {currentPhase.tasks.map(task => {
                const isCompleted = completedTasks.includes(task.id);
                return (
                  <button
                    key={task.id}
                    onClick={() => handleTaskToggle(task.id)}
                    className="w-full text-left p-5 border border-white/[0.07] rounded-lg hover:border-white/[0.15] hover:bg-[#151A24] transition-all group outline-none"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
                        isCompleted
                          ? 'bg-cyan-500 border-cyan-500'
                          : 'border-gray-600 group-hover:border-cyan-500'
                      }`}>
                        {isCompleted && <CheckCircle2 className="w-5 h-5 text-white" />}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold mb-1 ${isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>
                          {task.title}
                        </h3>
                        <p className="text-sm text-gray-400">{task.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="mt-10 flex gap-3 justify-between">
              <button
                onClick={() => setCurrentPhaseIndex(Math.max(0, currentPhaseIndex - 1))}
                disabled={currentPhaseIndex === 0}
                className="px-4 py-2 bg-[#151A24] text-gray-300 rounded-lg hover:bg-[#1A1D24] disabled:opacity-50 disabled:cursor-not-allowed transition-colors outline-none"
              >
                ← Anterior
              </button>

              <div className="flex items-center gap-2 text-gray-400 text-sm">
                Fase {currentPhaseIndex + 1} de {guide.phases.length}
              </div>

              <button
                onClick={() => setCurrentPhaseIndex(Math.min(guide.phases.length - 1, currentPhaseIndex + 1))}
                disabled={currentPhaseIndex === guide.phases.length - 1}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors outline-none font-semibold"
              >
                Próxima →
              </button>
            </div>
          </div>

          {/* Completion Message */}
          {progressPercentage === 100 && (
            <div className="mt-8 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/30 rounded-xl p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Parabéns! 🎉</h3>
              <p className="text-gray-300">Completou este guia com sucesso. Bem feito!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeFiGuideDetail;
