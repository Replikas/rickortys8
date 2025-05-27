import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import AdminDashboard from "@/pages/admin-dashboard";
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
      const response = await fetch("/api/admin/status");
      if (!response.ok) throw new Error("Failed to fetch admin status");
      return response.json();
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Simple protected route wrapper
  const ProtectedRoute = ({ component: Component, ...rest }: ProtectedRouteProps) => {
    if (isLoading) {
      return null; // Or a loading spinner
    }
    
    if (!adminStatus?.isAdmin) {
      return <Redirect to="/" />;
    }

    return <Route {...rest} component={Component} />;
  };

  return (
    <Switch>
      <Route path="/" component={Home} />
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
