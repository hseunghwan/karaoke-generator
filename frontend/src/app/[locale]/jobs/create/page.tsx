import initTranslations from '@/lib/i18n';
import { JobCreationWizard } from "@/components/jobs/job-creation-wizard";

export const metadata = {
  title: "Create New Job | Karaoke Generator",
  description: "Upload media and generate karaoke subtitles",
};

export default async function CreateJobPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await initTranslations(locale, ['job']);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('create_job', { ns: 'common' })}</h2>
        <p className="text-muted-foreground">
          {t('upload_media')}
        </p>
      </div>
      <JobCreationWizard />
    </div>
  );
}
