import { useState } from 'react';
import { useAnamneses } from '@/lib/queries';
import { useCachedQuery } from '@/lib/offline';
import { base44 } from '@/api/base44Client';
import AnamnesisEditor from './AnamnesisEditor';
import StepEditor from './StepEditor';
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { toast } from '@/components/ui/toaster';
import { useQueryClient } from '@tanstack/react-query';

export default function AnamnesisManager() {
  const qc = useQueryClient();
  const { data: anamneses = [] } = useAnamneses();

  const [selectedAnamnesis, setSelectedAnamnesis] = useState<any | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAnam, setEditingAnam] = useState<any | null>(null);

  // Step modal
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<any | null>(null);

  // View responses toggle
  const [showResponses, setShowResponses] = useState(false);

  // Active anamnèse steps query
  const { data: steps = [] } = useCachedQuery<any[]>({
    queryKey: ['staff-steps', selectedAnamnesis?.id || 'none'],
    enabled: Boolean(selectedAnamnesis?.id),
    queryFn: async () => {
      if (!selectedAnamnesis?.id) return [];
      return base44.entities.AnamnesisStep.filter(
        { anamnesis_id: selectedAnamnesis.id },
        'order',
        50
      );
    },
    staleTime: 5000,
  });

  // Client responses entries query
  const { data: entries = [] } = useCachedQuery<any[]>({
    queryKey: ['staff-anamnesis-entries', selectedAnamnesis?.id || 'none'],
    enabled: Boolean(selectedAnamnesis?.id && showResponses),
    queryFn: async () => {
      if (!selectedAnamnesis?.id) return [];
      return base44.entities.AnamnesisEntry.filter(
        { anamnesis_id: selectedAnamnesis.id },
        '-created_date',
        100
      );
    },
    staleTime: 5000,
  });

  const handleSaveAnam = async (data: any) => {
    if (editingAnam?.id) {
      await base44.entities.Anamnesis.update(editingAnam.id, data);
      toast({ title: 'Anamnèse modifiée', variant: 'success' });
    } else {
      await base44.entities.Anamnesis.create(data);
      toast({ title: 'Nouvelle anamnèse créée', variant: 'success' });
    }
    qc.invalidateQueries({ queryKey: ['anamneses'] });
  };

  const handleDeleteAnam = async (id: string) => {
    await base44.entities.Anamnesis.delete(id);
    if (selectedAnamnesis?.id === id) setSelectedAnamnesis(null);
    qc.invalidateQueries({ queryKey: ['anamneses'] });
    toast({ title: 'Anamnèse supprimée', variant: 'default' });
  };

  const handleSaveStep = async (stepData: any) => {
    if (editingStep?.id) {
      await base44.entities.AnamnesisStep.update(editingStep.id, stepData);
      toast({ title: 'Étape modifiée', variant: 'success' });
    } else {
      await base44.entities.AnamnesisStep.create(stepData);
      toast({ title: 'Nouvelle étape ajoutée', variant: 'success' });
    }
    qc.invalidateQueries({ queryKey: ['staff-steps', selectedAnamnesis?.id] });
  };

  const handleDeleteStep = async (stepId: string) => {
    await base44.entities.AnamnesisStep.delete(stepId);
    qc.invalidateQueries({ queryKey: ['staff-steps', selectedAnamnesis?.id] });
    toast({ title: 'Étape supprimée', variant: 'default' });
  };

  return (
    <div className="space-y-8 font-body">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow block mb-0.5">Bilans de santé</span>
          <h2 className="font-display text-2xl sm:text-3xl text-cacao font-medium">
            Questionnaires d'Anamnèse
          </h2>
          <p className="text-xs text-cacao/65 mt-0.5">
            Établissez des parcours de questions personnalisées et suivez la progression de chaque client.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingAnam(null);
            setEditorOpen(true);
          }}
          className="btn-gold py-2.5 px-5 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une anamnèse</span>
        </button>
      </div>

      {/* Anamneses Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {anamneses.map((anam: any) => {
          const isSelected = selectedAnamnesis?.id === anam.id;
          const isLocked = Boolean(anam.password && anam.password.trim());

          return (
            <div
              key={anam.id}
              onClick={() => {
                setSelectedAnamnesis(anam);
                setShowResponses(false);
              }}
              className={`card-soft p-5 transition cursor-pointer border ${
                isSelected
                  ? 'border-gold bg-gold/10 shadow-md'
                  : 'border-cacao/10 hover:border-cacao/25 bg-white/70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gold/15 text-gold flex items-center justify-center shrink-0">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-medium text-lg text-cacao">
                        {anam.name}
                      </h4>
                      {isLocked ? (
                        <span title="Protégé par mot de passe">
                          <Lock className="w-3.5 h-3.5 text-amber-700" />
                        </span>
                      ) : (
                        <span title="Accès libre">
                          <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-cacao/60 line-clamp-1">
                      {anam.description || 'Aucune description'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAnam(anam);
                      setEditorOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-cacao/70 hover:text-cacao hover:bg-cacao/10"
                    title="Modifier les réglages"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAnam(anam.id)}
                    className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Anamnèse Detail Panel */}
      {selectedAnamnesis && (
        <div className="card-soft p-6 sm:p-8 space-y-6 border border-cacao/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cacao/10">
            <div>
              <span className="eyebrow block mb-0.5">Dossier sélectionné</span>
              <h3 className="font-display text-2xl text-cacao font-medium">
                {selectedAnamnesis.name}
              </h3>
              <p className="text-xs text-cacao/65 mt-0.5">
                {steps.length} étape(s) configurée(s) • Mot de passe :{' '}
                {selectedAnamnesis.password ? '•••••••• (défini)' : 'Aucun (libre)'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowResponses(!showResponses)}
                className={`btn-soft py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5 ${
                  showResponses ? 'bg-cacao text-sand' : ''
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{showResponses ? 'Voir les étapes' : 'Suivi des réponses clients'}</span>
              </button>

              {!showResponses && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingStep(null);
                    setStepModalOpen(true);
                  }}
                  className="btn-gold py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une étape</span>
                </button>
              )}
            </div>
          </div>

          {/* VIEW 1: Steps of the questionnaire */}
          {!showResponses && (
            <div className="space-y-3">
              {steps.length === 0 ? (
                <div className="p-8 text-center text-xs text-cacao/50">
                  Cette anamnèse ne contient aucune étape. Ajoutez votre première étape.
                </div>
              ) : (
                steps.map((st) => (
                  <div
                    key={st.id}
                    className="p-4 rounded-2xl bg-white/70 border border-cacao/10 flex items-center justify-between gap-3 text-xs sm:text-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold text-xs">
                          {st.order || 1}
                        </span>
                        <h4 className="font-semibold text-cacao">{st.title}</h4>
                        <span className="text-[10px] uppercase font-bold text-cacao/45 bg-cacao/5 px-2 py-0.5 rounded">
                          Mode : {st.mode}
                        </span>
                      </div>
                      <p className="text-xs text-cacao/60 mt-1 pl-8">
                        {(st.questions || []).length} question(s) • {st.intro || 'Sans intro'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStep(st);
                          setStepModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-cacao/70 hover:text-cacao hover:bg-cacao/10"
                        title="Modifier l'étape"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStep(st.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        title="Supprimer l'étape"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* VIEW 2: Client Responses Tracking */}
          {showResponses && (
            <div className="space-y-4">
              <span className="eyebrow block">Réponses enregistrées en temps réel</span>
              {entries.length === 0 ? (
                <div className="p-8 text-center text-xs text-cacao/50">
                  Aucun client n'a encore débuté cette anamnèse.
                </div>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-5 rounded-2xl bg-white/70 border border-cacao/10 space-y-3 text-xs sm:text-sm"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-cacao/10">
                      <div>
                        <h4 className="font-bold text-cacao">{entry.client_name || 'Client'}</h4>
                        <span className="text-xs text-cacao/50">
                          {entry.client_phone ? `Tél : ${entry.client_phone}` : 'Clé : ' + entry.client_key.substring(0, 8)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-gold text-sm block">
                          Progression : {entry.progress || 0}%
                        </span>
                        {entry.completed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Complétée</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                            <Clock className="w-3.5 h-3.5" />
                            <span>En cours</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Step by step answers breakdown */}
                    <div className="space-y-2 pt-1">
                      {(entry.answers || []).map((ans: any, aIdx: number) => (
                        <div key={aIdx} className="p-3 rounded-xl bg-sand/60 text-xs space-y-1">
                          <span className="font-bold text-cacao block">{ans.step_title}</span>
                          <div className="text-cacao/75 space-y-0.5 pl-2">
                            {(ans.values || []).map((v: string, vIdx: number) => (
                              <p key={vIdx}>
                                • <span className="font-semibold text-cacao">{v || 'Sans réponse'}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Anamnesis Form Modal */}
      <AnamnesisEditor
        initialData={editingAnam}
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveAnam}
      />

      {/* Step Form Modal */}
      {selectedAnamnesis && (
        <StepEditor
          anamnesisId={selectedAnamnesis.id}
          initialData={editingStep}
          isOpen={stepModalOpen}
          onClose={() => setStepModalOpen(false)}
          onSave={handleSaveStep}
        />
      )}
    </div>
  );
}
