import { Route, Router, Switch } from 'wouter';
import Home from "./pages/home";
import Header from "./components/header";
import AdminLogin from "./pages/admin-login-page";
import AdminDashboard from "./pages/admin-dashboard";

import { Auth0Provider } from '@auth0/auth0-react';
import { Toaster } from "./components/ui/toaster";
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  // Need to ensure client/.env is created with VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

  if (!domain || !clientId || !audience) {
    console.error("Auth0 environment variables not set!");
    // Render a fallback or error message
    return <div>Error: Auth0 environment variables not configured.</div>;
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: audience,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Router>
          <Header 
            searchQuery="" // Provide dummy search query for now
            onSearchChange={() => {}} // Provide empty function for now
          />
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/admin/login" component={AdminLogin} />
            <Route path="/admin" component={AdminDashboard} />
            {/* Catch-all for 404 */}
            <Route>
              {() => <div>404 Not Found</div>}
            </Route>
          </Switch>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </Auth0Provider>
  );
}

export default App;
