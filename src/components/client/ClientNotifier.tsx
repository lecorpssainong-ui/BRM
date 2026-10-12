import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/toaster';
import { APPT_STATUS } from '@/lib/format';
import { useQueryClient } from '@tanstack/react-query';

interface ClientNotifierProps {
  clientKey: string;
}

export default function ClientNotifier({ clientKey }: ClientNotifierProps) {
  const qc = useQueryClient();
  const lastMsgCountRef = useRef<number | null>(null);
  const lastApptCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!clientKey) return;

    // Poller/listener on local db changes
    const checkUpdates = async () => {
      try {
        const msgs = await base44.entities.Message.filter({ client_key: clientKey });
        const staffMsgs = msgs.filter((m: any) => m.sender === 'staff');

        if (lastMsgCountRef.current !== null && staffMsgs.length > lastMsgCountRef.current) {
          const newest = staffMsgs[0];
          toast({
            title: 'Nouveau message du centre',
            description: newest?.text || 'Vous avez reçu une réponse du secrétariat.',
            variant: 'default',
          });
          qc.invalidateQueries({ queryKey: ['messages', clientKey] });
        }
        lastMsgCountRef.current = staffMsgs.length;

        const appts = await base44.entities.Appointment.filter({ client_key: clientKey });
        if (lastApptCountRef.current !== null && appts.length !== lastApptCountRef.current) {
          qc.invalidateQueries({ queryKey: ['appointments', clientKey] });
          const newest = appts[0];
          const statusMeta = APPT_STATUS[newest?.status] || { label: newest?.status };
          toast({
            title: 'Rendez-vous mis à jour',
            description: `${newest?.massage_name || 'Votre soin'} • ${statusMeta.label}`,
            variant: 'success',
          });
        }
        lastApptCountRef.current = appts.length;
      } catch {
        // ignore
      }
    };

    checkUpdates();

    const interval = setInterval(checkUpdates, 4000);
    const dbChangeHandler = () => checkUpdates();

    window.addEventListener('brm-db-change', dbChangeHandler);

    return () => {
      clearInterval(interval);
      window.removeEventListener('brm-db-change', dbChangeHandler);
    };
  }, [clientKey, qc]);

  return null;
}
