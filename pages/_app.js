import '../src/index.css';
import { AppProvider } from '../src/contexts/AppContext';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  
  // Liste des pages qui N'ONT PAS besoin du menu latéral
  const noLayout = ['/', '/login', '/test', '/simple', '/test-products'];
  
  // Vérifier si on doit afficher le Layout
  const shouldUseLayout = !noLayout.includes(router.pathname);

  // Si la page a besoin du Layout (menu latéral)
  if (shouldUseLayout) {
    return (
      <AppProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AppProvider>
    );
  }

  // Sinon, afficher la page sans Layout
  return (
    <AppProvider>
      <Component {...pageProps} />
    </AppProvider>
  );
}

export default MyApp;