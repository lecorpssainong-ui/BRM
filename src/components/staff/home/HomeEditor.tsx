import HeroEditor from './HeroEditor';
import HeaderEditor from './HeaderEditor';
import SectionsEditor from './SectionsEditor';

export default function HomeEditor() {
  return (
    <div className="space-y-8 font-body">
      <div>
        <span className="eyebrow block mb-0.5">Configuration client</span>
        <h2 className="font-display text-2xl sm:text-3xl text-cacao font-medium">
          Éditeur de la Page d'Accueil & En-tête
        </h2>
        <p className="text-xs sm:text-sm text-cacao/65 mt-0.5">
          Contrôlez l'intégralité des visuels, accroches et ordonnancement de la page principale.
        </p>
      </div>

      <HeroEditor />
      <HeaderEditor />
      <SectionsEditor />
    </div>
  );
}
