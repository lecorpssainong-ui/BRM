import { useState } from 'react';
import { PhoneCall, Copy, Check, ShieldCheck, CreditCard, Building2, Sparkles } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { useAppSettings } from '@/lib/queries';
import { copyToClipboard } from '@/lib/clipboard';
import { toast } from '@/components/ui/toaster';
import { motion } from 'framer-motion';

export type PaymentNetwork = 'mtn' | 'moov' | 'celtiis' | 'bank';

interface MomoPaymentCardProps {
  amount?: number;
  label?: string;
  initialNetwork?: PaymentNetwork;
  onNetworkChange?: (net: PaymentNetwork) => void;
}

export default function MomoPaymentCard({
  amount,
  label,
  initialNetwork = 'mtn',
  onNetworkChange,
}: MomoPaymentCardProps) {
  const { data: settings } = useAppSettings();
  const [network, setNetwork] = useState<PaymentNetwork>(initialNetwork);
  const [copied, setCopied] = useState(false);

  const handleNetworkSelect = (net: PaymentNetwork) => {
    setNetwork(net);
    if (onNetworkChange) onNetworkChange(net);
  };

  // MTN Details
  const mtnNumber = settings?.momo_number || '97000000';
  const mtnName = settings?.momo_name || 'Bénin Réflexologie Sarl';
  const mtnUssd = `*880*46*${mtnNumber}${amount ? `*${Math.round(amount)}` : ''}#`;

  // Moov Details
  const moovNumber = settings?.moov_number || '95000000';
  const moovName = settings?.moov_name || 'Bénin Réflexologie Sarl';
  const moovPrefix = settings?.moov_ussd || '*155*1*1*';
  const moovUssd = `${moovPrefix}${moovNumber}${amount ? `*${Math.round(amount)}` : ''}#`;

  // Celtiis Details
  const celtiisNumber = settings?.celtiis_number || '40000000';
  const celtiisName = settings?.celtiis_name || 'Bénin Réflexologie Sarl';
  const celtiisPrefix = settings?.celtiis_ussd || '*888*1*';
  const celtiisUssd = `${celtiisPrefix}${celtiisNumber}${amount ? `*${Math.round(amount)}` : ''}#`;

  // Bank Details
  const bankName = settings?.bank_name || 'Ecobank Bénin';
  const bankAccountName = settings?.bank_account_name || 'Bénin Réflexologie Sarl';
  const bankIban = settings?.bank_iban || 'BJ66 0100 1001 123456789012 34';
  const bankSwift = settings?.bank_swift || 'ECOCBJCO';

  // Network Specific Configs
  const config = {
    mtn: {
      title: 'MTN Mobile Money (MoMo)',
      gradient: 'from-amber-500 via-amber-600 to-stone-950',
      border: 'border-amber-400/40',
      accentBg: 'bg-amber-400 hover:bg-amber-300 text-stone-950',
      badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
      ussdCode: mtnUssd,
      merchantNumber: mtnNumber,
      merchantName: mtnName,
    },
    moov: {
      title: 'Moov Money (Flooz)',
      gradient: 'from-blue-600 via-indigo-700 to-stone-950',
      border: 'border-blue-400/40',
      accentBg: 'bg-blue-400 hover:bg-blue-300 text-stone-950',
      badgeBg: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
      ussdCode: moovUssd,
      merchantNumber: moovNumber,
      merchantName: moovName,
    },
    celtiis: {
      title: 'Celtiis Cash',
      gradient: 'from-emerald-600 via-teal-700 to-stone-950',
      border: 'border-emerald-400/40',
      accentBg: 'bg-emerald-400 hover:bg-emerald-300 text-stone-950',
      badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
      ussdCode: celtiisUssd,
      merchantNumber: celtiisNumber,
      merchantName: celtiisName,
    },
    bank: {
      title: 'Virement Bancaire (RIB / IBAN)',
      gradient: 'from-stone-800 via-amber-900 to-stone-950',
      border: 'border-gold/40',
      accentBg: 'bg-gold hover:bg-amber-300 text-stone-950',
      badgeBg: 'bg-gold/20 text-amber-200 border-gold/30',
      ussdCode: bankIban,
      merchantNumber: bankIban,
      merchantName: bankAccountName,
    },
  }[network];

  const handleDialOrCopy = async () => {
    if (network === 'bank') {
      await copyToClipboard(bankIban);
      setCopied(true);
      toast({ title: 'IBAN Copié !', description: 'Le RIB bancaire a été copié dans votre presse-papier.', variant: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } else {
      const cleanUssd = config.ussdCode.replace('#', '%23');
      window.location.href = `tel:${cleanUssd}`;
    }
  };

  const handleCopyCode = async () => {
    await copyToClipboard(config.ussdCode);
    setCopied(true);
    toast({ title: 'Copié avec succès !', description: 'Code prêt à coller dans votre téléphone.', variant: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      className={`rounded-[2.5rem] p-6 sm:p-8 bg-gradient-to-br ${config.gradient} text-sand shadow-2xl border ${config.border} space-y-6 font-body relative overflow-hidden select-none`}
    >
      {/* Dynamic Network Switcher Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => handleNetworkSelect('mtn')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            network === 'mtn' ? 'bg-amber-500 text-stone-950 shadow-md' : 'text-sand/70 hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-300" />
          <span>MTN MoMo</span>
        </button>

        <button
          type="button"
          onClick={() => handleNetworkSelect('moov')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            network === 'moov' ? 'bg-blue-600 text-white shadow-md' : 'text-sand/70 hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-300" />
          <span>Moov Money</span>
        </button>

        <button
          type="button"
          onClick={() => handleNetworkSelect('celtiis')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            network === 'celtiis' ? 'bg-emerald-600 text-white shadow-md' : 'text-sand/70 hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-300" />
          <span>Celtiis Cash</span>
        </button>

        <button
          type="button"
          onClick={() => handleNetworkSelect('bank')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            network === 'bank' ? 'bg-gold text-stone-950 shadow-md' : 'text-sand/70 hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Banque (RIB)</span>
        </button>
      </div>

      {/* Card Header & Amount */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-200 block mb-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Paiement Direct • {config.title}</span>
          </span>
          <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {amount ? formatPrice(amount) : 'Montant Libre'}
          </h3>
          {label && <p className="text-xs text-sand/85 mt-1 font-medium">{label}</p>}
        </div>

        <div className={`p-3 rounded-2xl ${config.badgeBg} shrink-0 shadow-lg`}>
          <ShieldCheck className="w-7 h-7" />
        </div>
      </div>

      {/* Code Display / IBAN Box */}
      {network === 'bank' ? (
        <div className="p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/15 space-y-2 text-center">
          <span className="text-xs text-amber-200/80 block font-semibold uppercase tracking-wider">Coordonnées Bancaires Officieuses :</span>
          <div className="text-sm sm:text-base font-mono font-bold text-white tracking-wider select-all break-all">
            {bankIban}
          </div>
          <div className="flex justify-between items-center text-xs text-sand/70 pt-2 border-t border-white/10 font-sans">
            <span>Banque : <strong className="text-white">{bankName}</strong></span>
            <span>SWIFT : <strong className="text-white">{bankSwift}</strong></span>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/15 text-center space-y-1">
          <span className="text-xs text-amber-200/80 block font-semibold uppercase tracking-wider">
            Code USSD de règlement marchand :
          </span>
          <div className="text-base sm:text-xl font-mono font-black tracking-widest text-white select-all">
            {config.ussdCode}
          </div>
        </div>
      )}

      {/* Merchant Details */}
      <div className="text-xs text-sand/90 space-y-1.5 p-3 rounded-xl bg-white/5 border border-white/10 font-body">
        <div className="flex justify-between items-center">
          <span className="opacity-75">Compte Bénéficiaire :</span>
          <span className="font-bold text-white">{config.merchantName}</span>
        </div>
        {network !== 'bank' && (
          <div className="flex justify-between items-center">
            <span className="opacity-75">N° Marchand Officiel :</span>
            <span className="font-mono font-bold text-gold">{config.merchantNumber}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={handleDialOrCopy}
          className={`btn-gold w-full sm:flex-1 py-3.5 ${config.accentBg} font-extrabold inline-flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xl active:scale-95 transition cursor-pointer`}
        >
          {network === 'bank' ? (
            <>
              <Copy className="w-4 h-4" />
              <span>Copier le RIB / IBAN</span>
            </>
          ) : (
            <>
              <PhoneCall className="w-4 h-4" />
              <span>Composer le code USSD</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleCopyCode}
          className="btn-ghost w-full sm:w-auto py-3.5 px-5 text-xs font-bold inline-flex items-center justify-center gap-1.5 bg-black/30 hover:bg-black/50 text-white border border-white/20 active:scale-95 transition cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copié !' : 'Copier'}</span>
        </button>
      </div>

      <div className="text-[10px] text-center text-sand/60 font-medium pt-1">
        ⚡ Transaction sécurisée, directe et sans frais supplémentaires.
      </div>
    </motion.div>
  );
}
