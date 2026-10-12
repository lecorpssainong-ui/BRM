import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function UserNotRegisteredError() {
  return (
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 mb-6">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="font-display text-3xl md:text-4xl text-cacao mb-3">Compte non reconnu</h1>
      <p className="text-cacao/70 max-w-md mb-8 text-sm">
        Votre adresse email ne fait pas encore partie de l'équipe autorisée. Veuillez contacter l'administrateur du centre pour recevoir une invitation.
      </p>
      <Link to="/" className="btn-dark inline-flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        Retour à l'accueil client
      </Link>
    </div>
  );
}
