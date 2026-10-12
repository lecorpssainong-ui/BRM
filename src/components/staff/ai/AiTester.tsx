import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Send, Bot, User } from 'lucide-react';

export default function AiTester() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    try {
      const res = await base44.functions.invoke('wellnessAdvisor', {
        question: question.trim(),
      });
      setResponse(res);
    } catch (err: any) {
      setResponse({ answer: `Erreur de réponse : ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-soft p-6 sm:p-7 space-y-4 border border-cacao/10 font-body">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-gold" />
        <h4 className="font-display text-xl text-cacao font-medium">
          Banc d'essai du Conseiller IA
        </h4>
      </div>
      <p className="text-xs text-cacao/65">
        Posez une question comme le ferait un client pour tester en direct le comportement du moteur local ou externe.
      </p>

      <form onSubmit={handleTest} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ex: J'ai mal aux lombaires et les pieds gonflés..."
          className="field text-xs sm:text-sm py-2.5"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="btn-gold py-2.5 px-5 text-xs font-semibold shrink-0 inline-flex items-center gap-1.5"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-cacao border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>Tester</span>
        </button>
      </form>

      {response && (
        <div className="p-4 rounded-2xl bg-white/70 border border-cacao/10 space-y-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-bold text-cacao">
            <Bot className="w-4 h-4 text-gold" />
            <span>Réponse générée ({response.mode || 'standard'}) :</span>
          </div>

          <p className="text-cacao/80 whitespace-pre-wrap leading-relaxed">
            {response.answer}
          </p>

          {response.actions && response.actions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-cacao/10">
              {response.actions.map((act: any, i: number) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full bg-gold/15 text-gold font-semibold text-xs"
                >
                  Bouton : {act.label}
                </span>
              ))}
            </div>
          )}

          {response.suggestions && response.suggestions.length > 0 && (
            <div className="text-[11px] text-cacao/60 pt-1">
              Suggestions proposées : {response.suggestions.join(' • ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
