import { useEffect } from 'react';
import { useRouter } from 'next/router';

// La page Paramètres a été fusionnée avec Magasins (/stores).
// Cette redirection assure la compatibilité avec d'éventuels bookmarks.
export default function SettingsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/stores');
  }, [router]);
  return null;
}
