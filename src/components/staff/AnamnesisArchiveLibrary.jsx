import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  FileDown,
  Trash2,
  Calendar,
  Phone,
  User,
  Activity,
  HeartPulse,
  RefreshCw,
  Eye,
  CheckCircle2,
  Sliders,
  Plus,
  Pencil,
  Save,
  Flame,
  Moon,
  Compass,
  Zap,
  Sparkles,
} from 'lucide-react';
import { mockStore, useMockStore } from '@/lib/mockStore';
import { supabase } from '@/lib/supabaseClient';
import { generateLuxuryAnamnesisPdf } from '@/lib/pdfReportGenerator';
import { toast } from '@/components/ui/toaster';

/**
 * ANAMNESIS ARCHIVE LIBRARY — BIBLIOTHÈQUE DES BILANS DE SANTÉ (PDF ARCHIVE)
 * & GESTIONNAIRE DE PROTOCOLES / QUESTIONS CLINIQUES (CONNECTÉ À SUPABASE)
 * 
 * Accessible côté Staff (Secrétaire & Modérateur) pour :
 * 1. Consulter, rechercher et télécharger les bilans cliniques PDF des patients.
 * 2. Éditer ou ajouter des questions/symptômes par pathologie (Stress, Sommeil, Lombaires, Digestion, Fatigue, Circulation).
 */
export default function AnamnesisArchiveLibrary() {
  const [activeTab, setActiveTab] = useState('archives'); // 'archives' | 'protocols'
  const [search, setSearch] = useState('');
  const [selectedEntryModal, setSelectedEntryModal] = useState(null);

  // 1. Lecture réactive des bilans archivés depuis Supabase
  const [supabaseEntries, setSupabaseEntries] = useState([]);
  const [loadingSb, setLoadingSb] = useState(false);

  const fetchSupabaseAnamneses = async () => {
    try {
      setLoadingSb(true);
      const { data, error } = await supabase
        .from('anamneses')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped = data.map((a) => {
          const innerData = a.data || {};
          return {
            id: a.id,
            user_id: a.user_id,
            reference: innerData.reference || `BRM-ANAM-${a.id.slice(0, 6)}`,
            client_name: a.patient_name || innerData.client_name || 'Patient',
            client_phone: a.patient_phone || innerData.client_phone || '',
            pathology: innerData.pathology || a.protocol_recommended || 'Bilan de vitalité',
            intensity: innerData.intensity ?? 5,
            symptoms: innerData.symptoms || [],
            pain_zones: Array.isArray(a.body_map_notes)
              ? a.body_map_notes.map((b) => (typeof b === 'object' ? b.zone || b.zone_name : b))
              : innerData.pain_zones || [],
            body_map_notes: a.body_map_notes,
            precautions: a.therapist_notes || innerData.precautions || 'Aucune',
            recommended_care: a.protocol_recommended || innerData.recommended_care || '',
            created_at: a.created_at,
          };
        });
        setSupabaseEntries(mapped);
      }
    } catch (e) {
      console.warn('[Supabase] Erreur lecture anamneses:', e);
    } finally {
      setLoadingSb(false);
    }
  };

  useEffect(() => {
    fetchSupabaseAnamneses();

    const channelName = `realtime_anamneses_${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'anamneses' },
        () => fetchSupabaseAnamneses()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const { data: mockEntries = [], refetch: refetchEntries } = useMockStore(
    'anamnesis_entries',
    (store) => store.getAnamnesisEntries()
  );

  // 2. Lecture réactive des protocoles de questions
  const { data: protocols = [], refetch: refetchProtocols } = useMockStore(
    'anamnesis_protocols',
    (store) => store.getAnamnesisProtocols()
  );

  const [deletedIds, setDeletedIds] = useState(() => new Set());
  const [localProtocols, setLocalProtocols] = useState([]);
  const [editingProtocol, setEditingProtocol] = useState(null);
  const [newSymptomText, setNewSymptomText] = useState('');

  const localEntries = useMemo(() => {
    const map = new Map();
    (mockEntries || []).forEach((e) => {
      if (e?.id && !deletedIds.has(e.id)) map.set(e.id, e);
    });
    (supabaseEntries || []).forEach((e) => {
      if (e?.id && !deletedIds.has(e.id)) map.set(e.id, e);
    });
    return Array.from(map.values());
  }, [supabaseEntries, mockEntries, deletedIds]);

  useEffect(() => {
    setLocalProtocols(protocols || []);
  }, [protocols]);

  const handleDownloadPdf = (e, entry) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const doc = generateLuxuryAnamnesisPdf(entry);
      doc.save(`Bilan-Clinique-${entry.client_name || 'Patient'}-${entry.reference || 'BRM'}.pdf`);
      toast.success('Bilan PDF généré !', 'Téléchargement lancé avec succès.');
    } catch (err) {
      console.error('Erreur génération PDF:', err);
      toast.error('Erreur de téléchargement.');
    }
  };

  const handleDeleteEntry = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();

    setDeletedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      try {
        await supabase.from('anamneses').delete().eq('id', id);
      } catch (sbErr) {
        console.warn('[Supabase] Erreur suppression anamnese:', sbErr);
      }
      const currentList = mockStore.getTable('anamnesis_entries');
      const filtered = currentList.filter((item) => item.id !== id);
      mockStore.setTable('anamnesis_entries', filtered);
      toast.success('Bilan retiré des archives.');
    } catch (err) {
      console.error('Erreur suppression bilan:', err);
      toast.error('Échec de la suppression.');
      refetchEntries();
    }
  };

  // Enregistrement d'un protocole modifié (questions / symptômes)
  const handleSaveProtocol = async (e) => {
    e?.preventDefault();
    if (!editingProtocol) return;

    try {
      await mockStore.saveAnamnesisProtocol(editingProtocol);
      toast.success('Protocole clinique mis à jour !', 'Les questions et symptômes ont été enregistrés.');
      setEditingProtocol(null);
      refetchProtocols();
    } catch (err) {
      console.error('Erreur sauvegarde protocole:', err);
      toast.error('Erreur lors de la mise à jour du protocole.');
    }
  };

  const handleAddSymptomToEditing = () => {
    if (!newSymptomText.trim() || !editingProtocol) return;
    const currentList = editingProtocol.symptomsList || [];
    setEditingProtocol({
      ...editingProtocol,
      symptomsList: [...currentList, newSymptomText.trim()],
    });
    setNewSymptomText('');
  };

  const handleRemoveSymptomFromEditing = (index) => {
    if (!editingProtocol) return;
    const currentList = [...(editingProtocol.symptomsList || [])];
    currentList.splice(index, 1);
    setEditingProtocol({
      ...editingProtocol,
      symptomsList: currentList,
    });
  };

  // Filtrage sécurisé anti-crash des bilans
  const filteredEntries = (localEntries || []).filter((item) => {
    if (!item) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (item.client_name || '').toLowerCase().includes(q);
      const matchPatho = (item.pathology || '').toLowerCase().includes(q);
      const matchPhone = (item.client_phone || '').includes(q);
      const matchRef = (item.reference || '').toLowerCase().includes(q);
      if (!matchName && !matchPatho && !matchPhone && !matchRef) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 font-body text-cacao dark:text-sand">
      {/* En-tête Général */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/70 dark:bg-stone-900/80 border border-amber-500/20 shadow-md backdrop-blur-xl">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Archive Médicale & Anamnèse Clinique • Staff Cockpit</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-display font-medium text-cacao dark:text-sand mt-0.5">
            Bibliothèque des Bilans & Protocoles de Santé
          </h2>
          <p className="text-xs text-cacao/65 dark:text-sand/65 mt-1">
            Consultez les bilans d'anamnèse soumis par les clients, téléchargez leurs PDF luxueux ou personnalisez les questions par pathologie.
          </p>
        </div>

        {/* Boutons d'Onglets Staff */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/60 dark:bg-stone-800/80 border border-cacao/10 shadow-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('archives')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'archives'
                ? 'bg-cacao text-sand shadow-sm'
                : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-gold" />
            <span>Bilans Archivés ({(localEntries || []).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('protocols')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'protocols'
                ? 'bg-cacao text-sand shadow-sm'
                : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-gold" />
            <span>Questions & Pathologies</span>
          </button>
        </div>
      </div>

      {/* ONGLET 1 : ARCHIVES DES BILANS REÇUS (PDF) */}
      {activeTab === 'archives' && (
        <div className="space-y-4">
          {/* Barre de Recherche et Actualisation */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-cacao/40 dark:text-sand/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom de patient, pathologie, téléphone ou référence..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-cacao/10 dark:border-white/10 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden transition shadow-inner"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                refetchEntries();
                toast.info('Archives actualisées');
              }}
              className="p-2.5 rounded-2xl bg-white/60 dark:bg-stone-800/60 hover:bg-gold/20 text-cacao dark:text-sand border border-cacao/10 transition cursor-pointer"
              title="Actualiser la liste"
            >
              <RefreshCw className="w-4 h-4 text-gold" />
            </button>
          </div>

          {/* Liste des Bilans */}
          {filteredEntries.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/40 dark:bg-stone-900/40 border border-dashed border-cacao/20 dark:border-white/20 space-y-2">
              <FileText className="w-10 h-10 text-cacao/30 dark:text-sand/30 mx-auto" />
              <h4 className="text-base font-semibold">Aucun bilan d'anamnèse enregistré</h4>
              <p className="text-xs text-cacao/60 dark:text-sand/60 max-w-sm mx-auto">
                Les bilans remplis par les clients depuis l'application apparaîtront instantanément ici avec leur lien de téléchargement PDF.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {filteredEntries.map((entry) => {
                  const intensity = Number(entry?.intensity ?? 5);

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setSelectedEntryModal(entry)}
                      className="p-5 rounded-3xl bg-white/80 dark:bg-stone-900/80 border border-amber-500/20 hover:border-gold/50 shadow-md hover:shadow-xl transition cursor-pointer flex flex-col justify-between space-y-4"
                    >
                      {/* Haut de carte */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-medium text-base text-cacao dark:text-sand truncate">
                              {entry.client_name || 'Patient'}
                            </h4>
                            <span className="text-[10px] font-mono font-bold text-gold px-2 py-0.5 rounded-full bg-gold/15">
                              {entry.reference || 'BRM'}
                            </span>
                          </div>

                          <div className="text-xs text-cacao/65 dark:text-sand/65 flex items-center gap-3">
                            {entry.client_phone && (
                              <span className="flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3 text-gold" />
                                <span>{entry.client_phone}</span>
                              </span>
                            )}
                            <span>•</span>
                            <span>
                              {entry.created_at
                                ? new Date(entry.created_at).toLocaleDateString('fr-FR')
                                : 'Récent'}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                            intensity >= 7
                              ? 'bg-rose-500/20 text-rose-500'
                              : 'bg-gold/20 text-gold'
                          }`}
                        >
                          {intensity}/10
                        </span>
                      </div>

                      {/* Détails cliniques */}
                      <div className="space-y-1.5 p-3 rounded-2xl bg-white/50 dark:bg-stone-800/50 border border-cacao/5 text-xs">
                        <div>
                          <span className="font-bold text-gold">Pathologie : </span>
                          <span className="font-medium text-cacao dark:text-sand">
                            {entry.pathology}
                          </span>
                        </div>

                        {entry.pain_zones && entry.pain_zones.length > 0 && (
                          <div>
                            <span className="font-bold text-cacao/70 dark:text-sand/70">Zones ciblées : </span>
                            <span className="text-cacao/80 dark:text-sand/80">
                              {entry.pain_zones.join(', ')}
                            </span>
                          </div>
                        )}

                        {entry.recommended_care && (
                          <div>
                            <span className="font-bold text-cacao/70 dark:text-sand/70">
                              Protocole conseillé :{' '}
                            </span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {entry.recommended_care}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions (Télécharger PDF / Supprimer) */}
                      <div className="flex items-center justify-between pt-2 border-t border-cacao/10 dark:border-white/10">
                        <button
                          type="button"
                          onClick={(e) => handleDownloadPdf(e, entry)}
                          className="btn-gold py-1.5 px-4 rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>Télécharger PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteEntry(e, entry.id)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                          title="Supprimer des archives"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ONGLET 2 : GESTION DES PROTOCOLES & QUESTIONS PAR PATHOLOGIE */}
      {activeTab === 'protocols' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-cacao/80 dark:text-sand/80 flex items-center justify-between">
            <div>
              <strong className="text-gold">Configuration des Questions Thérapeutiques :</strong> Modifiez les manifestations et questions proposées aux patients lors de leur bilan d'anamnèse.
            </div>
            <button
              type="button"
              onClick={() => {
                refetchProtocols();
                toast.info('Protocoles synchronisés');
              }}
              className="p-2 rounded-xl bg-white/60 dark:bg-stone-800/60 hover:bg-gold/20 text-cacao dark:text-sand transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gold" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(localProtocols || []).map((proto) => {
              const isEditing = editingProtocol?.id === proto.id;

              return (
                <div
                  key={proto.id}
                  className="p-5 rounded-3xl bg-white/80 dark:bg-stone-900/80 border border-amber-500/20 shadow-md flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-medium text-base text-cacao dark:text-sand flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-gold" />
                        <span>{proto.title}</span>
                      </h4>

                      <button
                        type="button"
                        onClick={() => setEditingProtocol(isEditing ? null : { ...proto })}
                        className="px-3 py-1.5 rounded-xl bg-white/60 dark:bg-stone-800/60 text-xs font-semibold hover:bg-gold/20 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Pencil className="w-3 h-3 text-gold" />
                        <span>{isEditing ? 'Fermer' : 'Modifier les questions'}</span>
                      </button>
                    </div>

                    <p className="text-xs text-cacao/65 dark:text-sand/65">
                      {proto.subtitle}
                    </p>

                    <div className="pt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold block mb-1">
                        Questions & Symptômes configurés ({(proto.symptomsList || []).length}) :
                      </span>
                      <ul className="space-y-1 text-xs">
                        {(proto.symptomsList || []).map((symp, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-cacao/80 dark:text-sand/80">
                            <span className="text-gold">•</span>
                            <span>{symp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/50 dark:bg-stone-800/50 text-xs space-y-1">
                      <div>
                        <strong className="text-cacao/70 dark:text-sand/70">Soin conseillé : </strong>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {proto.recommendedMassage}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal ou Tiroir d'Édition du Protocole */}
          {editingProtocol && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                onClick={() => setEditingProtocol(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              />
              <div className="relative z-10 max-w-xl w-full p-6 rounded-3xl bg-[#140C08]/98 border border-amber-500/30 text-sand shadow-2xl backdrop-blur-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h3 className="font-display text-lg text-sand font-medium">
                    Modifier les questions : {editingProtocol.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingProtocol(null)}
                    className="text-sand/60 hover:text-sand transition font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-sand/80 block mb-1">Sous-titre explicatif :</label>
                    <input
                      type="text"
                      value={editingProtocol.subtitle || ''}
                      onChange={(e) =>
                        setEditingProtocol({ ...editingProtocol, subtitle: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-white/10 border border-white/10 text-sand text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-sand/80 block mb-1">
                      Liste des questions / symptômes proposés au patient :
                    </label>
                    <div className="space-y-2 mb-3">
                      {(editingProtocol.symptomsList || []).map((symp, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                          <span className="flex-1 text-xs text-sand/90">{symp}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSymptomFromEditing(idx)}
                            className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                            title="Retirer cette question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Ajout d'une nouvelle question / symptôme */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSymptomText}
                        onChange={(e) => setNewSymptomText(e.target.value)}
                        placeholder="Ajouter une nouvelle question ou manifestation..."
                        className="flex-1 p-2.5 rounded-xl bg-white/10 border border-white/10 text-sand text-xs focus:ring-1 focus:ring-amber-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSymptomToEditing();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddSymptomToEditing}
                        className="px-3.5 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 transition cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Ajouter</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-sand/80 block mb-1">Soin conseillé par défaut :</label>
                    <input
                      type="text"
                      value={editingProtocol.recommendedMassage || ''}
                      onChange={(e) =>
                        setEditingProtocol({ ...editingProtocol, recommendedMassage: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-white/10 border border-white/10 text-sand text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProtocol(null)}
                    className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold text-sand hover:bg-white/20 transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProtocol}
                    className="btn-gold py-2 px-5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Enregistrer le protocole</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Détail & Prévisualisation d'un Bilan */}
      {selectedEntryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedEntryModal(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative z-10 max-w-lg w-full p-6 rounded-3xl bg-[#140C08]/95 border border-amber-500/30 text-sand shadow-2xl backdrop-blur-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold text-gold uppercase tracking-wider">
                Fiche Clinique • {selectedEntryModal.reference}
              </span>
              <button
                type="button"
                onClick={() => setSelectedEntryModal(null)}
                className="text-sand/60 hover:text-sand transition text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <h3 className="font-display text-lg text-sand font-medium">
                  {selectedEntryModal.client_name}
                </h3>
                <p className="text-xs text-sand/60 font-mono">
                  {selectedEntryModal.client_phone}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div><strong>Pathologie :</strong> {selectedEntryModal.pathology}</div>
                <div><strong>Intensité des douleurs :</strong> {selectedEntryModal.intensity}/10</div>
                <div><strong>Zones sensibles :</strong> {(selectedEntryModal.pain_zones || []).join(', ')}</div>
                <div><strong>Soin recommandé :</strong> {selectedEntryModal.recommended_care}</div>
                {selectedEntryModal.precautions && (
                  <div><strong>Précautions :</strong> {selectedEntryModal.precautions}</div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={(e) => handleDownloadPdf(e, selectedEntryModal)}
                className="btn-gold py-2 px-5 rounded-2xl text-xs font-bold inline-flex items-center gap-2 shadow-md cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Exporter en PDF Luxueux</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
