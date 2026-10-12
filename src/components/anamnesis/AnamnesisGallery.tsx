import { useState, useEffect } from 'react';
import { useAnamneses } from '@/lib/queries';
import { useCachedQuery } from '@/lib/offline';
import { useProfile } from '@/lib/clientProfile';
import { base44 } from '@/api/base44Client';
import { formatDate } from '@/lib/format';
import {
  Lock,
  Unlock,
  ClipboardList,
  ArrowRight,
  X,
  History,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronDown,
  HeartPulse,
  FileDown,
  Phone,
} from 'lucide-react';
import SegmentedTabs, { TabItem } from '@/components/shared/SegmentedTabs';
import AnamnesisRunner from './AnamnesisRunner';
import AdvancedAnamnesis from '@/components/AdvancedAnamnesis';
import { mockStore } from '@/lib/mockStore';
import { generateLuxuryAnamnesisPdf } from '@/lib/pdfReportGenerator';
import { toast } from '@/components/ui/toaster';

export default function AnamnesisGallery() {
  const profile = useProfile();
  const { data: anamneses = [], isLoading } = useAnamneses();

  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');
  const [showClinicalEngine, setShowClinicalEngine] = useState(false);
  const [selectedAnamnesis, setSelectedAnamnesis] = useState<any | null>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [expandedResponseId, setExpandedResponseId] = useState<string | null>(null);
  const [clinicalEntries, setClinicalEntries] = useState<any[]>([]);

  // Fetch client's clinical anamnesis reports from mockStore
  useEffect(() => {
    mockStore.getAnamnesisEntries(profile?.client_key).then((entries) => {
      setClinicalEntries(entries || []);
    });
  }, [profile?.client_key, showClinicalEngine]);

  const handleDownloadPdf = (entry: any) => {
    try {
      const doc = generateLuxuryAnamnesisPdf(entry);
      doc.save(`Bilan-Vitalite-BRM-${entry.reference || 'BRM'}.pdf`);
      toast.success('Bilan PDF généré !', 'Téléchargement lancé avec succès.');
    } catch (e) {
      toast.error('Erreur lors de la génération du PDF.');
    }
  };

  // Fetch client's completed history from AnamnesisResponse or AnamnesisEntry
  const { data: history = [] } = useCachedQuery<any[]>({
    queryKey: ['client-anamnesis-history', profile?.client_key || 'anon'],
    queryFn: async () => {
      if (!profile?.client_key) return [];
      const responses = await base44.entities.AnamnesisResponse.filter(
        { client_key: profile.client_key },
        '-created_date',
        50
      );
      if (responses.length > 0) return responses;
      // Fallback to AnamnesisEntry
      return base44.entities.AnamnesisEntry.filter(
        { client_key: profile.client_key, completed: true },
        '-created_date',
        50
      );
    },
    staleTime: 5000,
  });

  const handleOpen = async (anam: any) => {
    setSelectedAnamnesis(anam);
    setPasswordInput('');
    setPasswordError('');

    if (!anam.password || !anam.password.trim()) {
      setIsUnlocked(true);
    } else {
      setIsUnlocked(false);
    }

    try {
      const stepList = await base44.entities.AnamnesisStep.filter(
        { anamnesis_id: anam.id },
        'order',
        50
      );
      setSteps(stepList);
    } catch {
      setSteps([]);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === (selectedAnamnesis?.password || '').trim()) {
      setIsUnlocked(true);
      setPasswordError('');
    } else {
      setPasswordError('Mot de passe incorrect. Demandez-le au secrétariat du centre.');
    }
  };

  const handleClose = () => {
    setSelectedAnamnesis(null);
    setSteps([]);
    setIsUnlocked(false);
  };

  const tabs: TabItem[] = [
    { value: 'available', label: 'Questionnaires', icon: ClipboardList },
    {
      value: 'history',
      label: `Historique (${history.length})`,
      icon: History,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-44 rounded-3xl bg-white/40 animate-pulse" />
      </div>
    );
  }

  // Active Runner View
  if (selectedAnamnesis && isUnlocked) {
    return (
      <AnamnesisRunner
        anamnesis={selectedAnamnesis}
        steps={steps}
        onClose={handleClose}
      />
    );
  }

  // Password Gate View
  if (selectedAnamnesis && !isUnlocked) {
    return (
      <div className="card-soft p-8 sm:p-10 max-w-md mx-auto my-8 text-center space-y-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-full text-cacao/60 hover:text-cacao"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-16 h-16 rounded-full bg-gold/15 text-gold flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <span className="eyebrow block mb-1">Accès sécurisé</span>
          <h3 className="font-display text-2xl sm:text-3xl text-cacao font-medium">
            {selectedAnamnesis.name}
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-cacao/70 leading-relaxed font-body">
          Cette anamnèse est protégée. Saisissez le mot de passe remis par le centre lors de votre venue.
        </p>

        <form onSubmit={handleUnlock} className="space-y-4 font-body text-left">
          <input
            type="password"
            required
            value={passwordInput}
            onChange={(e) => {
              setPasswordInput(e.target.value);
              setPasswordError('');
            }}
            placeholder="Mot de passe d'accès"
            className="field text-center font-bold tracking-widest text-base"
          />

          {passwordError && (
            <p className="text-xs font-semibold text-rose-700 text-center">
              {passwordError}
            </p>
          )}

          <button
            type="submit"
            className="btn-gold w-full py-3 inline-flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <Unlock className="w-4 h-4" />
            <span>Ouvrir l'anamnèse</span>
          </button>
        </form>
      </div>
    );
  }

  if (showClinicalEngine) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowClinicalEngine(false)}
          className="text-xs font-semibold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          ← Revenir aux bilans standard
        </button>
        <AdvancedAnamnesis onComplete={() => setShowClinicalEngine(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body">
      {/* Switcher: Available / History */}
      <div className="flex items-center justify-between gap-4">
        <SegmentedTabs
          tabs={tabs}
          value={activeTab}
          onChange={(v) => setActiveTab(v as any)}
          id="anamnesis-view-tabs"
        />
      </div>

      {activeTab === 'available' ? (
        <div className="space-y-6">
          {/* Bannière Hero : Bilan Clinique par Pathologie */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-900/90 via-[#1C120C] to-[#120A06] text-sand border border-amber-500/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
            <div className="space-y-1.5 z-10 max-w-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nouveau Moteur Thérapeutique • Approche par Pathologie</span>
              </span>
              <h3 className="font-display font-medium text-xl sm:text-2xl text-sand">
                Bilan Clinique de Vitalité & Cartographie Corporelle
              </h3>
              <p className="text-xs text-sand/75 leading-relaxed">
                Diagnostic interactif guidé selon votre problématique (Stress, Sommeil, Lombaires, Digestion, Fatigue, Circulation). Génération instantanée de votre Bilan PDF Luxueux et transmission directe au secrétariat.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowClinicalEngine(true)}
              className="btn-gold py-3 px-6 rounded-2xl text-xs font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition z-10 shrink-0 self-start md:self-auto"
            >
              <HeartPulse className="w-4 h-4 text-stone-950" />
              <span>Lancer mon Bilan Clinique</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {anamneses.map((anam: any) => {
            const isProtected = Boolean(anam.password && anam.password.trim());

            return (
              <div
                key={anam.id}
                onClick={() => handleOpen(anam)}
                className="card-soft overflow-hidden group cursor-pointer flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition duration-300 border border-cacao/10"
              >
                <div>
                  <div className="relative aspect-[16/9] w-full bg-stone-900 overflow-hidden">
                    <img
                      src={
                        anam.image_url ||
                        'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={anam.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />

                    <div className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md text-white">
                      {isProtected ? (
                        <Lock className="w-4 h-4 text-amber-300" />
                      ) : (
                        <Unlock className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 block mb-0.5">
                        Bilan de santé
                      </span>
                      <h3 className="font-display font-medium text-xl leading-snug drop-shadow">
                        {anam.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-5 font-body">
                    <p className="text-xs sm:text-sm text-cacao/70 line-clamp-3 leading-relaxed">
                      {anam.description ||
                        'Faites le point sur vos zones de tensions et préparez votre séance en toute sérénité.'}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-0 flex items-center justify-between border-t border-cacao/5 mt-auto">
                  <span className="text-xs font-semibold text-cacao/60">
                    {isProtected ? 'Protégé par code' : 'Accès libre'}
                  </span>
                  <span className="btn-gold py-1.5 px-4 text-xs font-semibold inline-flex items-center gap-1">
                    <span>Commencer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      ) : (
        /* History View */
        <div className="space-y-6">
          {/* Section 1 : Bilans Cliniques PDF Générés */}
          {clinicalEntries && clinicalEntries.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-gold" />
                <h4 className="font-display font-medium text-lg text-cacao">
                  Vos Bilans Cliniques de Vitalité ({clinicalEntries.length})
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clinicalEntries.map((cEntry: any) => (
                  <div
                    key={cEntry.id}
                    className="p-5 rounded-3xl bg-white/80 border border-amber-500/20 shadow-md flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-gold px-2 py-0.5 rounded-full bg-gold/15">
                          {cEntry.reference || 'BRM-ANAM'}
                        </span>
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">
                          Gêne : {cEntry.intensity}/10
                        </span>
                      </div>

                      <h5 className="font-display font-medium text-base text-cacao mt-1">
                        {cEntry.pathology}
                      </h5>

                      <p className="text-xs text-cacao/65">
                        {cEntry.created_at ? new Date(cEntry.created_at).toLocaleDateString('fr-FR') : 'Récent'}
                      </p>

                      {cEntry.recommended_care && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-xs text-cacao/80 mt-2">
                          <strong className="text-gold">Soin conseillé : </strong>
                          <span>{cEntry.recommended_care}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-cacao/10 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(cEntry)}
                        className="btn-gold py-1.5 px-4 rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Télécharger le PDF</span>
                      </button>

                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Transmis au secrétariat</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2 : Questionnaires Standard */}
          {history.length === 0 && (!clinicalEntries || clinicalEntries.length === 0) ? (
            <div className="card-soft p-12 text-center max-w-md mx-auto">
              <ClipboardList className="w-12 h-12 text-gold mx-auto mb-3" />
              <h4 className="font-display text-xl text-cacao mb-1">
                Aucun bilan complété pour le moment
              </h4>
              <p className="text-xs text-cacao/65">
                Remplissez votre premier bilan de vitalité pour retrouver ici vos réponses et l'évolution de vos tensions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item: any) => {
                const isExpanded = expandedResponseId === item.id;
                const dateStr = item.created_date
                  ? formatDate(item.created_date, 'd MMMM yyyy à HH:mm')
                  : 'Récemment';

                return (
                  <div
                    key={item.id}
                    className="card-soft p-5 border border-cacao/10 transition-all duration-200"
                  >
                    <div
                      onClick={() => setExpandedResponseId(isExpanded ? null : item.id)}
                      className="flex items-start justify-between gap-4 cursor-pointer"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-medium text-lg text-cacao">
                              {item.anamnesis_name || 'Bilan de vitalité'}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-600/10 text-emerald-700 text-[10px] font-bold">
                              Complété (100%)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-cacao/60 mt-1">
                            <Calendar className="w-3.5 h-3.5 text-gold" />
                            <span>{dateStr}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-1 rounded-full text-cacao/60 hover:text-cacao">
                        <ChevronDown
                          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && item.answers && (
                      <div className="mt-4 pt-4 border-t border-cacao/10 space-y-3 text-xs text-cacao/80">
                        <span className="font-bold text-cacao uppercase tracking-wider text-[11px] block">
                          Synthèse des réponses enregistrées :
                        </span>
                        <div className="space-y-2.5 bg-white/60 p-4 rounded-2xl border border-cacao/5">
                          {item.answers.map((ans: any, idx: number) => (
                            <div key={idx} className="space-y-0.5">
                              <span className="font-semibold text-cacao block">
                                {ans.step_title || `Étape ${idx + 1}`}
                              </span>
                              <p className="text-cacao/70 pl-2 border-l-2 border-gold/40">
                                {Array.isArray(ans.values)
                                  ? ans.values.filter(Boolean).join(' • ') || 'Répondu'
                                  : String(ans.values || '')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
