import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function AdminLogin() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const [, navigate] = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    navigate("/admin");
    return null;
  }

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