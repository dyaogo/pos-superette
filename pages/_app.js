import '../src/index.css'; // Vos styles existants
import { AppProvider } from '../src/contexts/AppContext';

function MyApp({ Component, pageProps }) {
  return (
    <AppProvider>
      <Component {...pageProps} />
    </AppProvider>
  );
}

export default MyApp;