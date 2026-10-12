import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Route,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  ArrowLeft,
  PartyPopper,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { speak, stopSpeaking, voiceOn, setVoiceOn } from '@/lib/speak';
import { useProfile } from '@/lib/clientProfile';
import { base44 } from '@/api/base44Client';
import QuestionField from './QuestionField';

const ENCOURAGEMENTS = [
  'Vous avancez magnifiquement, continuez ainsi.',
  'Excellent, une étape de plus franchie.',
  'Vous êtes sur la bonne voie, prenez votre temps.',
  'C\'est noté avec soin. Encore un petit effort.',
  'Bravo, votre régularité fait toute la différence.',
];

interface AnamnesisRunnerProps {
  anamnesis: any;
  steps: any[];
  onClose: () => void;
}

export default function AnamnesisRunner({
  anamnesis,
  steps,
  onClose,
}: AnamnesisRunnerProps) {
  const profile = useProfile();
  const [selectedMode, setSelectedMode] = useState<'bot' | 'guide' | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [entryId, setEntryId] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(voiceOn());
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [encouragement, setEncouragement] = useState<string>('');

  const sortedSteps = Array.isArray(steps)
    ? [...steps].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  const currentStep = sortedSteps[currentStepIdx];
  const totalSteps = sortedSteps.length;

  // Speak welcome message upon mode selection
  const handleSelectMode = (mode: 'bot' | 'guide') => {
    setSelectedMode(mode);
    if (anamnesis.welcome_message) {
      speak(anamnesis.welcome_message);
    }
  };

  // Speak step title and intro when step changes
  useEffect(() => {
    if (!selectedMode || isCompleted || !currentStep) return;
    const textToRead = `${currentStep.title}. ${currentStep.intro || ''}`;
    speak(textToRead);

    return () => {
      stopSpeaking();
    };
  }, [currentStepIdx, selectedMode, isCompleted, currentStep]);

  const toggleVoice = () => {
    const next = !isVoiceActive;
    setIsVoiceActive(next);
    setVoiceOn(next);
  };

  const handleAnswerChange = (questionIdx: number, val: any) => {
    const stepKey = currentStep?.id || String(currentStepIdx);
    setAnswers((prev) => ({
      ...prev,
      [stepKey]: {
        ...(prev[stepKey] || {}),
        [questionIdx]: val,
      },
    }));
  };

  // Check if current step is fully answered
  const isCurrentStepAnswered = () => {
    if (!currentStep) return false;
    const stepKey = currentStep.id || String(currentStepIdx);
    const stepAnswers = answers[stepKey] || {};
    const questions = currentStep.questions || [];
    if (questions.length === 0) return true;

    return questions.every((_: any, idx: number) => {
      const a = stepAnswers[idx];
      return a !== undefined && a !== '' && (Array.isArray(a) ? a.length > 0 : true);
    });
  };

  // Persist progress to AnamnesisEntry
  const persistProgress = async (completed = false) => {
    const progress = Math.round(((currentStepIdx + 1) / totalSteps) * 100);
    const formattedAnswers = sortedSteps.slice(0, currentStepIdx + 1).map((st) => {
      const stepKey = st.id;
      const stepAns = answers[stepKey] || {};
      const values = (st.questions || []).map((_: any, qIdx: number) => {
        const v = stepAns[qIdx];
        return Array.isArray(v) ? v.join(', ') : String(v ?? '');
      });
      return {
        step_id: st.id,
        step_title: st.title,
        values,
      };
    });

    try {
      if (entryId) {
        await base44.entities.AnamnesisEntry.update(entryId, {
          answers: formattedAnswers,
          progress,
          completed,
        });
      } else {
        const created = await base44.entities.AnamnesisEntry.create({
          anamnesis_id: anamnesis.id,
          anamnesis_name: anamnesis.name,
          client_key: profile?.client_key || crypto.randomUUID(),
          client_name: profile?.name || 'Client',
          client_phone: profile?.phone || '',
          answers: formattedAnswers,
          progress,
          completed,
        });
        setEntryId(created.id);
      }

      // If completed, record explicit entry in AnamnesisResponse and ActivityLog
      if (completed) {
        await base44.entities.AnamnesisResponse.create({
          anamnesis_id: anamnesis.id,
          anamnesis_name: anamnesis.name,
          client_key: profile?.client_key || crypto.randomUUID(),
          client_name: profile?.name || 'Client',
          client_phone: profile?.phone || '',
          answers: formattedAnswers,
          progress: 100,
          completed: true,
          created_date: new Date().toISOString(),
        });

        await base44.entities.ActivityLog.create({
          action: 'anamnesis_completed',
          user_name: profile?.name || 'Client',
          details: `Bilan d'anamnèse complété : "${anamnesis.name}" par ${profile?.name || 'Client'}`,
          created_date: new Date().toISOString(),
        });
      }
    } catch {
      // offline silent catch
    }
  };

  const handleNext = async () => {
    if (currentStepIdx < totalSteps - 1) {
      await persistProgress(false);
      // Random encouragement for Bot mode
      const randomEnc = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
      setEncouragement(randomEnc);
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      await persistProgress(true);
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  // MODE SELECTION SCREEN (STEP 0)
  if (!selectedMode) {
    return (
      <div className="card-soft p-6 sm:p-10 max-w-xl mx-auto my-6 space-y-6 text-center">
        <div className="flex justify-between items-center pb-2">
          <span className="eyebrow">Bilan de santé personnalisé</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-cacao/60 hover:text-cacao"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="font-display text-3xl sm:text-4xl text-cacao font-medium">
          {anamnesis.name}
        </h2>
        <p className="text-sm text-cacao/75 leading-relaxed font-body">
          {anamnesis.description ||
            'Prenez quelques instants pour faire le point sur vos sensations corporelles et vos attentes pour votre prochaine séance.'}
        </p>

        <div className="space-y-4 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-cacao/60 block">
            Choisissez votre mode d'accompagnement :
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Le Bot */}
            <button
              type="button"
              onClick={() => handleSelectMode('bot')}
              className="p-5 rounded-3xl border border-cacao/10 bg-white/70 hover:border-gold hover:shadow-lg transition-all text-left flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-gold/15 text-gold flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Bot className="w-6 h-6" />
                </div>
                <h4 className="font-display text-xl text-cacao font-medium mb-1">
                  Le Bot Bienveillant
                </h4>
                <p className="text-xs text-cacao/65 leading-relaxed font-body">
                  Un accompagnement pas à pas, question après question, qui vous encourage à chaque progression.
                </p>
              </div>
              <span className="text-xs font-bold text-gold mt-4 inline-flex items-center gap-1">
                <span>Démarrer avec le Bot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Le Guide */}
            <button
              type="button"
              onClick={() => handleSelectMode('guide')}
              className="p-5 rounded-3xl border border-cacao/10 bg-white/70 hover:border-gold hover:shadow-lg transition-all text-left flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Route className="w-6 h-6" />
                </div>
                <h4 className="font-display text-xl text-cacao font-medium mb-1">
                  Le Guide Structuré
                </h4>
                <p className="text-xs text-cacao/65 leading-relaxed font-body">
                  Tous les questionnaires d'un coup d'œil, avec la barre de progression et le pourcentage restant.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 mt-4 inline-flex items-center gap-1">
                <span>Démarrer avec le Guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // COMPLETION SCREEN
  if (isCompleted) {
    return (
      <div className="card-soft p-8 sm:p-12 max-w-lg mx-auto my-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-md">
          <PartyPopper className="w-8 h-8" />
        </div>

        <div>
          <span className="eyebrow text-emerald-800 block mb-1">Félicitations</span>
          <h2 className="font-display text-3xl sm:text-4xl text-cacao font-medium">
            Anamnèse terminée
          </h2>
        </div>

        <p className="text-sm sm:text-base text-cacao/75 leading-relaxed font-body">
          Merci pour votre confiance. Le secrétariat reçoit votre dossier et pourra suivre votre progression séance après séance.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="btn-gold py-3 px-8 text-sm font-semibold"
        >
          Retourner aux découvertes
        </button>
      </div>
    );
  }

  const donePct = Math.round(((currentStepIdx + 1) / totalSteps) * 100);
  const remainingPct = 100 - donePct;

  return (
    <div className="card-soft p-6 sm:p-8 max-w-2xl mx-auto my-4 space-y-6 font-body">
      {/* Top Navigation & Progress Bar */}
      <div className="space-y-3 pb-3 border-b border-cacao/10">
        <div className="flex items-center justify-between text-xs font-semibold text-cacao/70">
          <button
            type="button"
            onClick={onClose}
            className="hover:text-cacao inline-flex items-center gap-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Quitter</span>
          </button>

          <span className="text-cacao font-bold">
            Étape {currentStepIdx + 1} / {totalSteps} • il reste {remainingPct}%
          </span>

          <button
            type="button"
            onClick={toggleVoice}
            className="p-1.5 rounded-full hover:bg-cacao/5 transition text-cacao/70 hover:text-cacao"
            title={isVoiceActive ? 'Couper la voix' : 'Activer la voix'}
          >
            {isVoiceActive ? <Volume2 className="w-4 h-4 text-gold" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Animated Progress Bar */}
        <div className="h-2 w-full bg-cacao/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-gold to-[#94652e] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${donePct}%` }}
            transition={{ type: 'spring', damping: 26, stiffness: 180 }}
          />
        </div>

        {/* Step dots (Clickable to jump) */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {sortedSteps.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentStepIdx(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStepIdx
                  ? 'w-6 bg-gold'
                  : idx < currentStepIdx
                  ? 'w-2 bg-gold/50'
                  : 'w-2 bg-cacao/15'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep?.id || currentStepIdx}
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.98 }}
          transition={{ type: 'spring', damping: 30, stiffness: 260 }}
          className="space-y-6"
        >
          {/* Header styling according to mode */}
          {selectedMode === 'bot' ? (
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-stone-900 text-gold flex items-center justify-center shrink-0 shadow">
                <Bot className="w-5 h-5" />
              </div>
              <div className="p-4 rounded-3xl rounded-tl-md bg-white/70 border border-cacao/10 shadow-sm flex-1">
                <h3 className="font-display text-xl sm:text-2xl text-cacao font-medium mb-1">
                  {currentStep.title}
                </h3>
                {currentStep.intro && (
                  <p className="text-xs sm:text-sm text-cacao/75 leading-relaxed font-body">
                    {currentStep.intro}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <span className="eyebrow block mb-1">Étape {currentStepIdx + 1}</span>
              <h3 className="font-display text-2xl sm:text-3xl text-cacao font-medium">
                {currentStep.title}
              </h3>
              {currentStep.intro && (
                <p className="text-xs sm:text-sm text-cacao/70 mt-1 leading-relaxed">
                  {currentStep.intro}
                </p>
              )}
            </div>
          )}

          {/* Bot Encouragement if shown */}
          {selectedMode === 'bot' && encouragement && (
            <p className="text-xs italic text-gold font-serif">
              ✨ « {encouragement} »
            </p>
          )}

          {/* Questions list */}
          <div className="space-y-6 pt-2">
            {(currentStep.questions || []).map((q: any, qIdx: number) => {
              const stepKey = currentStep.id || String(currentStepIdx);
              const val = answers[stepKey]?.[qIdx];
              return (
                <QuestionField
                  key={qIdx}
                  question={q}
                  mode={currentStep.mode || 'choice'}
                  value={val}
                  onChange={(newVal) => handleAnswerChange(qIdx, newVal)}
                />
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-cacao/10">
        <button
          type="button"
          disabled={currentStepIdx === 0}
          onClick={handlePrev}
          className="btn-soft text-xs sm:text-sm py-2.5 px-4 inline-flex items-center gap-1.5 disabled:opacity-30"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Précédent</span>
        </button>

        <button
          type="button"
          disabled={!isCurrentStepAnswered()}
          onClick={handleNext}
          className="btn-gold text-xs sm:text-sm py-2.5 px-6 font-semibold inline-flex items-center gap-2 disabled:opacity-40"
        >
          <span>{currentStepIdx === totalSteps - 1 ? 'Terminer l\'anamnèse' : 'Étape suivante'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
