import { useToast } from "@/hooks/use-toast";
import { useAuth0 } from "@auth0/auth0-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminLogin() {
  const { loginWithRedirect, isAuthenticated, isLoading: authLoading } = useAuth0();
  const [, navigate] = useLocation();

  // Check Auth0 loading state first
  if (authLoading) {
    return <div>Loading authentication...</div>;
  }

  // If authenticated via Auth0, navigate to admin dashboard
  if (isAuthenticated) {
    navigate("/admin");
    return null;
  }

  // If not authenticated, show Auth0 login button
  return (
    <div className="min-h-screen bg-space-dark text-white flex items-center justify-center">
      <div className="bg-space-surface p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
        <Button
          onClick={() => loginWithRedirect()}
          className="w-full bg-portal-blue hover:bg-portal-blue/80"
        >
          Login with Auth0
        </Button>
      </div>
    </div>
  );
} 