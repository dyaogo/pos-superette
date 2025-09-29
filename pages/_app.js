import '../src/index.css';
import { AppProvider } from '../src/contexts/AppContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Désactiver SSR pour éviter les erreurs de context
const NoSSR = dynamic(() => Promise.resolve(({ children }) => <>{children}</>), {
  ssr: false
});

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const noLayout = ['/', '/login'];
  const shouldUseLayout = !noLayout.includes(router.pathname);

  return (
    <NoSSR>
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
    </NoSSR>
  );
}

export default MyApp;