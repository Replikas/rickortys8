import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminLoginPage from "@/pages/admin-login-page";
import type { ComponentType } from 'react';

// Define the props for ProtectedRoute
interface ProtectedRouteProps {
  component: ComponentType<any>;
  path: string;
  [key: string]: any; // Allow other route props
}

function Router() {
  const { data: adminStatus, isLoading } = useQuery({
    queryKey: ["/api/admin/status"],
    queryFn: async () => {
      console.log('Checking admin status...');
      const response = await fetch("/api/admin/status");
      if (!response.ok) throw new Error("Failed to fetch admin status");
      const data = await response.json();
      console.log('Admin status response:', data);
      return data;
    },
    staleTime: 0, // Remove stale time to always refetch
    refetchOnMount: true, // Refetch when component mounts
  });

  // Simple protected route wrapper
  const ProtectedRoute = ({ component: Component, ...rest }: ProtectedRouteProps) => {
    console.log('ProtectedRoute render - isLoading:', isLoading, 'adminStatus:', adminStatus);
    if (isLoading) {
      return <div className="min-h-screen bg-space-dark text-white flex items-center justify-center">
        <p>Loading...</p>
      </div>;
    }
    
    if (!adminStatus?.isAdmin) {
      console.log('Not admin, redirecting to login...');
      return <Redirect to="/admin/login" />;
    }

    console.log('Admin authenticated, rendering protected route...');
    return <Route {...rest} component={Component} />;
  };

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
