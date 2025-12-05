import initTranslations from '@/lib/i18n';
import EditorPage from './page-content';

// Server Component wrapper for metadata and data fetching
export const metadata = {
  title: "Subtitle Editor | Karaoke Generator",
  description: "Edit subtitles and adjust timing",
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t, resources } = await initTranslations(locale, ['editor', 'common']);

  return (
      <EditorPage />
  );
}
