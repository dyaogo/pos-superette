import '../src/index.css';
import { AppProvider } from '../src/contexts/AppContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const noLayout = ['/', '/login'];
  const shouldUseLayout = !noLayout.includes(router.pathname);

  // Toujours wrapper avec AuthProvider EN PREMIER
  return (
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
  );
}

export default MyApp;