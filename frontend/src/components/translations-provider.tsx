'use client';

import { I18nextProvider } from 'react-i18next';
import initTranslations from '@/lib/i18n';
import { createInstance, Resource } from 'i18next';
import { ReactNode, useMemo, useState, useEffect } from 'react';

export default function TranslationsProvider({
  children,
  locale,
  namespaces,
  resources,
}: {
  children: ReactNode;
  locale: string;
  namespaces: string[];
  resources?: Resource;
}) {
  const i18n = createInstance();

  // We use a small trick here to initialize instance only once
  // but keep it updated if props change (though usually locale/ns don't change dynamically this way in server components)
  // Using useState initializer to run this once on client mount
  const [instance, setInstance] = useState(i18n);

  useEffect(() => {
    const init = async () => {
        await initTranslations(locale, namespaces, i18n, resources);
        setInstance(i18n); // Trigger re-render with initialized instance
    };

    if(!i18n.isInitialized) {
        init();
    }
  }, [locale, namespaces, resources, i18n]);

  // If resources are passed from server component (hydration), we initialize synchronously
  if (resources && !i18n.isInitialized) {
      initTranslations(locale, namespaces, i18n, resources);
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

