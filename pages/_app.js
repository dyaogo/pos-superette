import '../src/index.css'; // Vos styles existants
import { AppProvider } from '../src/contexts/AppContext';
import { AuthProvider } from '../src/contexts/AuthContext';

function MyApp({ Component, pageProps }) {
  return (
    <AppProvider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </AppProvider>
  );
}

export default MyApp;