import PageHeader from '@/components/shared/PageHeader';
import ProfileRequired from '@/components/shared/ProfileRequired';
import AdvancedAnamnesis from '@/components/AdvancedAnamnesis';

export default function ClinicalAnamnesis() {
  return (
    <ProfileRequired reason="Pour établir votre bilan clinique de vitalité et l'archiver dans votre dossier personnel, veuillez renseigner votre profil.">
      <div className="space-y-6 pb-12">
        <PageHeader
          eyebrow="Bilan Thérapeutique & Vitalité"
          title="Diagnostic Clinique & Anamnèse"
          subtitle="Identifiez vos déséquilibres par pathologie, générez votre Bilan de Santé officiel en PDF haute fidélité et transmettez-le instantanément au secrétariat."
        />

        <AdvancedAnamnesis />
      </div>
    </ProfileRequired>
  );
}
