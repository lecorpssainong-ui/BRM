import PageHeader from '@/components/shared/PageHeader';
import HealthToolsHub from '@/components/tools/HealthToolsHub';

export default function HealthHub() {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="Biométrie & Énergie Vitale"
        title="Hub de Santé Holistique"
        subtitle="Évaluez vos constantes, ajustez vos curseurs interactifs et laissez l'Oracle IA élaborer votre ordonnance de soins et de synergies végétales."
      />

      <HealthToolsHub />
    </div>
  );
}
