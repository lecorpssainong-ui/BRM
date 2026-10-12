import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center text-gold mb-6">
        <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '8s' }} />
      </div>
      <h1 className="font-display text-4xl md:text-5xl text-cacao mb-3">Page introuvable</h1>
      <p className="text-cacao/60 max-w-md mb-8 text-sm">
        Le chemin demandé n'existe pas ou a été déplacé. Retrouvez votre espace de détente et vos soins en revenant à l'accueil.
      </p>
      <Link to="/" className="btn-gold inline-flex items-center gap-2">
        <Home className="w-4 h-4" />
        Retour à l'accueil
      </Link>
    </div>
  );
}
