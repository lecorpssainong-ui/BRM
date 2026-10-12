import { useState, useEffect } from 'react';
import { useSecretaryAppointments } from '@/lib/queries';
import { supabase } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';
import StaffAppointmentRow from './StaffAppointmentRow';
import StaffNewAppointment from './StaffNewAppointment';
import { Calendar, Plus, Filter, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { deleteRecordWithConfirm } from '@/lib/deleteHelper';

export default function StaffAppointments() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isNewOpen, setIsNewOpen] = useState(false);

  const { data: appointments = [], isLoading, refetch } = useSecretaryAppointments();

  const [localAppointments, setLocalAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (appointments) {
      setLocalAppointments(appointments);
    }
  }, [appointments]);

  const handleDelete = async (recordId: string) => {
    try {
      const { data, error } = await supabase.from('appointments').delete().eq('id', recordId);
      console.log('Delete appointment:', { data, error });
      if (error) {
        console.error('Erreur Supabase delete appointment:', error);
        if (navigator.onLine) {
          throw error;
        }
      }
    } catch (err: any) {
      if (navigator.onLine) {
        console.error('[StaffAppointments] Delete appointment error:', err);
      }
    }

    const success = await deleteRecordWithConfirm(recordId, {
      tableName: 'appointments',
      base44Entity: 'Appointment',
      confirmMessage: 'Voulez-vous vraiment supprimer définitivement ce rendez-vous ?',
      successMessage: 'Rendez-vous supprimé.',
    });
    if (success) {
      setLocalAppointments((prev) => prev.filter((item) => item.id !== recordId));
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['secretary-appointments'] });
      qc.invalidateQueries({ queryKey: ['staff-badge-appts'] });
      refetch();
    }
  };

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ['appointments'] });
    qc.invalidateQueries({ queryKey: ['secretary-appointments'] });
    qc.invalidateQueries({ queryKey: ['staff-badge-appts'] });
    refetch();
  };

  const filtered = localAppointments.filter((a: any) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (a.client_name || '').toLowerCase().includes(q);
      const matchSoin = (a.massage_name || '').toLowerCase().includes(q);
      const matchPhone = (a.client_phone || '').includes(q);
      if (!matchName && !matchSoin && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow block mb-0.5">Planning & Séances</span>
          <h2 className="font-display text-2xl sm:text-3xl text-cacao font-medium">
            Gestion des rendez-vous
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsNewOpen(true)}
          className="btn-gold py-2.5 px-5 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau rendez-vous</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white/50 p-3 rounded-2xl border border-cacao/10">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-cacao/40 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer par nom, téléphone, soin..."
            className="field text-xs py-2 pl-9"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
          {[
            { value: 'all', label: 'Tous' },
            { value: 'pending', label: 'En attente' },
            { value: 'accepted', label: 'Confirmés' },
            { value: 'modified', label: 'Reprogrammés' },
            { value: 'refused', label: 'Refusés' },
            { value: 'cancelled', label: 'Annulés' },
          ].map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === f.value
                  ? 'bg-cacao text-sand'
                  : 'bg-white/80 text-cacao/70 hover:bg-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-32 rounded-3xl bg-white/40 animate-pulse" />
          <div className="h-32 rounded-3xl bg-white/40 animate-pulse" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-soft p-12 text-center max-w-md mx-auto my-8">
          <Calendar className="w-12 h-12 text-gold mx-auto mb-3" />
          <h4 className="font-display text-xl text-cacao">Aucun rendez-vous trouvé</h4>
          <p className="text-xs text-cacao/65 mt-1 font-body">
            Modifiez vos filtres ou enregistrez une nouvelle demande.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((appt) => (
            <StaffAppointmentRow
              key={appt.id}
              appointment={appt}
              onRefresh={handleRefresh}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* New Appointment Modal */}
      <StaffNewAppointment
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
