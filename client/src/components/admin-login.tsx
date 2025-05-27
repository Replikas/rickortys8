import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check admin status
  const { data: adminStatus } = useQuery({
    queryKey: ["/api/admin/status"],
    queryFn: async () => {
      const response = await fetch("/api/admin/status");
      if (!response.ok) throw new Error("Failed to fetch admin status");
      return response.json();
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Login mutation
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
      toast({
        title: "Login Successful",
        description: "You are now logged in as admin.",
      });
      setPassword("");
      setShowLogin(false);
      // Invalidate the admin status query to refetch it on the Home page
      queryClient.invalidateQueries({ queryKey: ["/api/admin/status"] });
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Logout Successful",
        description: "You are now logged out.",
      });
      // Invalidate the admin status query to refetch it on the Home page
      queryClient.invalidateQueries({ queryKey: ["/api/admin/status"] });
    },
    onError: (error) => {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (adminStatus?.isAdmin) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-yellow-400 text-sm font-bold">Admin Mode</span>
        <Button 
          onClick={() => logoutMutation.mutate()} 
          disabled={logoutMutation.isLoading}
          variant="ghost"
          className="text-white hover:bg-white/10"
        >
          Logout
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {showLogin && (
        <div className="bg-space-surface/90 backdrop-blur-sm p-3 rounded-lg border border-space-lighter flex items-center space-x-2">
          <Input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-space-dark border-gray-600 rounded-md px-3 py-1 text-sm text-white placeholder-gray-400 focus:ring-1 focus:ring-portal-blue focus:border-transparent w-40"
          />
          <Button 
            onClick={() => loginMutation.mutate(password)} 
            disabled={loginMutation.isLoading || password.length === 0}
            variant="outline"
            className="bg-space-lighter hover:bg-space-lighter/80 border-space-lighter text-white text-sm"
          >
            Login
          </Button>
        </div>
      )}
      {!showLogin && (
         <Button 
           onClick={() => setShowLogin(true)}
           variant="ghost"
           className="text-white hover:bg-white/10"
         >
           Admin Login
         </Button>
      )}
    </div>
  );
} 