import '../src/index.css';
import { AppProvider } from '../src/contexts/AppContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';


function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Attendre que le composant soit monté côté client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Ne rien rendre pendant le SSR
  if (!mounted) {
    return null;
  }
  
  const noLayout = ['/', '/login'];
  const shouldUseLayout = !noLayout.includes(router.pathname);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          {shouldUseLayout ? (
            <Layout>
              <Component {...pageProps} />
            </Layout>
          ) : (
            <Component {...pageProps} />
          )}
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>

  );
}

export default MyApp;