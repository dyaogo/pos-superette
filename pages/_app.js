import "../src/index.css";
import { AppProvider } from "../src/contexts/AppContext";
import { AuthProvider } from "../src/contexts/AuthContext";
import { OnlineProvider } from "../src/contexts/OnlineContext";
import Layout from "../components/Layout";
import ErrorBoundary from "../components/ErrorBoundary";
import { useRouter } from "next/router";

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  const noLayout = ["/", "/login"];
  const shouldUseLayout = !noLayout.includes(router.pathname);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <OnlineProvider>
          <AppProvider>
            {shouldUseLayout ? (
              <Layout>
                <Component {...pageProps} />
              </Layout>
            ) : (
              <Component {...pageProps} />
            )}
          </AppProvider>
        </OnlineProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
