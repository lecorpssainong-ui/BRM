import { ToolDefinition } from '@/lib/credits';

interface ToolCreditCardProps {
  tool: ToolDefinition;
  mode: 'standard' | 'integration';
  power: number;
  onModeChange: (newMode: 'standard' | 'integration') => void;
  onPowerChange: (newPower: number) => void;
}

export default function ToolCreditCard({
  tool,
  mode,
  power,
  onModeChange,
  onPowerChange,
}: ToolCreditCardProps) {
  const isIntegration = mode === 'integration';

  return (
    <div className="card-soft p-6 sm:p-7 space-y-5 border border-cacao/10 font-body">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cacao/10">
        <div>
          <h4 className="font-display font-medium text-xl text-cacao">
            {tool.label}
          </h4>
          <span className="text-[11px] text-cacao/50 block mt-0.5">
            Outil clé : <code className="font-mono text-gold">{tool.key}</code>
          </span>
        </div>

        {/* Switch button */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-cacao/5 border border-cacao/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onModeChange('standard')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
              !isIntegration
                ? 'bg-cacao text-sand shadow-sm'
                : 'text-cacao/60 hover:text-cacao'
            }`}
          >
            Standard (0 crédit)
          </button>
          <button
            type="button"
            onClick={() => onModeChange('integration')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
              isIntegration
                ? 'bg-gold text-cacao shadow-sm'
                : 'text-cacao/60 hover:text-cacao'
            }`}
          >
            Intégration
          </button>
        </div>
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className={`p-4 rounded-2xl border transition ${
          !isIntegration ? 'bg-white/80 border-gold/40 shadow-sm' : 'bg-white/30 border-cacao/5 opacity-60'
        }`}>
          <div className="flex items-center gap-1.5 font-bold text-cacao mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Mode Standard (Recommandé)</span>
          </div>
          <p className="text-cacao/75 leading-relaxed">{tool.standard}</p>
          <span className="text-[10px] font-bold text-emerald-800 block mt-2">
            Coût : 0 crédit • 100% illimité
          </span>
        </div>

        <div className={`p-4 rounded-2xl border transition ${
          isIntegration ? 'bg-gold/15 border-gold shadow-sm' : 'bg-white/30 border-cacao/5 opacity-60'
        }`}>
          <div className="flex items-center gap-1.5 font-bold text-cacao mb-1.5">
            <span className="w-2 h-2 rounded-full bg-gold" />
            <span>Mode Intégration</span>
          </div>
          <p className="text-cacao/75 leading-relaxed">{tool.integration}</p>
          <span className="text-[10px] font-bold text-amber-800 block mt-2">
            Consomme des crédits plateforme
          </span>
        </div>
      </div>

      {/* Power Slider if in integration mode */}
      {isIntegration && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-cacao">
              {tool.powerLabel} : <strong className="text-gold font-bold text-sm">{power} / 10</strong>
            </span>
            <span className="text-[11px] text-cacao/60">
              {power <= 3 ? 'Économique' : power <= 8 ? 'Équilibré' : 'Puissance maximale'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={power}
            onChange={(e) => onPowerChange(Number(e.target.value))}
            className="w-full accent-gold cursor-pointer"
          />
        </div>
      )}

      {tool.hint && (
        <p className="text-xs text-cacao/65 italic font-body pt-1">
          💡 {tool.hint}
        </p>
      )}
    </div>
  );
}
