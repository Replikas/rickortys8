import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { useToast } from "@/hooks/use-toast"; // Temporarily removed
import { useLocation } from 'wouter'; // Import useLocation

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const queryClient = useQueryClient();
  // const { toast } = useToast(); // Temporarily removed
  const [, navigate] = useLocation(); // Use useLocation to get navigate

  const loginMutation = useMutation({
    mutationFn: async (adminPassword: string) => {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: adminPassword }),
      });
      if (!response.ok) {
        throw new Error("Login failed");
      }
      return response.json();
    },
    onSuccess: () => {
      // Removed toast call
      setPassword("");
      // Invalidate the admin status query and navigate to admin dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/admin/status"] });
      navigate('/admin'); // Use navigate from useLocation
    },
    onError: (error) => {
      // Removed toast call
    },
  });

  return (
    <div className="min-h-screen bg-space-dark text-white flex items-center justify-center p-4">
      <div className="bg-space-surface/90 backdrop-blur-sm p-8 rounded-lg border border-space-lighter shadow-xl text-center max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
        <div className="flex flex-col items-center space-y-4">
          <Input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-space-dark border-gray-600 rounded-md px-3 py-2 text-base text-white placeholder-gray-400 focus:ring-1 focus:ring-portal-blue focus:border-transparent w-full"
          />
          <Button 
            onClick={() => loginMutation.mutate(password)} 
            disabled={loginMutation.isLoading || password.length === 0}
            variant="outline"
            className="bg-space-lighter hover:bg-space-lighter/80 border-space-lighter text-white text-base w-full"
          >
            {loginMutation.isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </div>
      </div>
    </div>
  );
} 