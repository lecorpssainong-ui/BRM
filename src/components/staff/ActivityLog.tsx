import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/format';
import { getStoredActivities, ActivityLogEntry } from '@/lib/activityLogger';
import { History, Activity, Clock, ShieldCheck, RefreshCw, Trash2, Filter } from 'lucide-react';
import { toast } from '@/components/ui/toaster';

export default function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>(() => getStoredActivities());
  const [filterAction, setFilterAction] = useState<string>('all');

  const refreshLogs = () => {
    setLogs(getStoredActivities());
  };

  useEffect(() => {
    refreshLogs();
    const handleActivityChange = () => refreshLogs();
    window.addEventListener('brm-activity-change', handleActivityChange);
    window.addEventListener('brm-db-change', handleActivityChange);
    return () => {
      window.removeEventListener('brm-activity-change', handleActivityChange);
      window.removeEventListener('brm-db-change', handleActivityChange);
    };
  }, []);

  const handleClear = () => {
    if (!confirm('Voulez-vous effacer l\'historique local du journal d\'activité ?')) return;
    localStorage.removeItem('brm_activity_log');
    refreshLogs();
    toast({ title: 'Journal d\'activité vidé', variant: 'default' });
  };

  const filteredLogs = logs.filter((l) => {
    if (filterAction === 'all') return true;
    return l.action === filterAction;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300';
      case 'update':
        return 'bg-amber-500/20 text-amber-900 dark:text-amber-300';
      case 'delete':
      case 'purge':
        return 'bg-rose-500/20 text-rose-800 dark:text-rose-300';
      case 'login':
        return 'bg-blue-500/20 text-blue-800 dark:text-blue-300';
      case 'role_change':
        return 'bg-purple-500/20 text-purple-800 dark:text-purple-300';
      default:
        return 'bg-stone-500/20 text-stone-800 dark:text-stone-300';
    }
  };

  return (
    <div className="space-y-6 font-body max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-cacao/10">
        <div>
          <span className="eyebrow block mb-0.5">Surveillance & Audit</span>
          <h2 className="font-display text-2xl sm:text-3xl text-cacao dark:text-sand font-medium">
            Journal d'Activité du Centre
          </h2>
          <p className="text-xs sm:text-sm text-cacao/65 dark:text-sand/65 mt-0.5">
            Historique chronologique des connexions, modifications et actions réalisées dans l'application.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={refreshLogs}
            className="btn-soft py-2 px-3 text-xs inline-flex items-center gap-1.5 cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gold" />
            <span>Actualiser</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="btn-soft py-2 px-3 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center gap-1.5 cursor-pointer"
            title="Vider le journal"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Effacer</span>
          </button>
        </div>
      </div>

      <div className="card-soft p-6 sm:p-8 space-y-4 border border-cacao/10 bg-white/80 dark:bg-stone-900/80 shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-cacao/10 gap-3 flex-wrap">
          <div className="flex items-center gap-2 font-bold text-sm text-cacao dark:text-sand">
            <Activity className="w-4 h-4 text-gold" />
            <span>Événements récents ({filteredLogs.length})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-cacao/50" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="field text-xs py-1 px-2.5 bg-white dark:bg-stone-800 cursor-pointer"
            >
              <option value="all">Toutes les actions</option>
              <option value="login">Connexions</option>
              <option value="role_change">Changements de rôles</option>
              <option value="create">Créations</option>
              <option value="update">Modifications</option>
              <option value="delete">Suppressions</option>
              <option value="purge">Purges de données</option>
            </select>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <p className="text-xs text-cacao/50 dark:text-sand/50 italic py-8 text-center">
              Aucun événement enregistré dans cette catégorie.
            </p>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-white/70 dark:bg-stone-800/70 border border-cacao/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-gold/40 transition"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-gold uppercase text-[10px] bg-gold/15 px-2 py-0.5 rounded">
                      {log.table}
                    </span>
                    <span className={`font-semibold capitalize text-[10px] px-2 py-0.5 rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                    {log.user_email && (
                      <span className="text-[10px] text-cacao/60 dark:text-sand/60 font-mono">
                        ({log.user_email})
                      </span>
                    )}
                  </div>
                  <p className="text-cacao/80 dark:text-sand/80 font-medium">
                    {log.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-cacao/50 dark:text-sand/50 text-[11px] shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {new Date(log.timestamp).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
