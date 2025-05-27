import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
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
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) throw new Error("Invalid password");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Logged in as admin",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/status"] });
      setPassword("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Invalid password",
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
      if (!response.ok) throw new Error("Failed to logout");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Logged out successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/status"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    },
  });

  if (adminStatus?.isAdmin) {
    return (
      <Button
        variant="outline"
        className="bg-space-surface/80 backdrop-blur-sm text-red-500 hover:text-red-600 hover:bg-red-500/10"
        onClick={() => logoutMutation.mutate()}
      >
        Logout Admin
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-2 bg-space-surface/80 backdrop-blur-sm p-2 rounded-lg">
      <Input
        type="password"
        placeholder="Admin Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-40 bg-space-lighter border-gray-600 text-white placeholder-gray-400"
      />
      <Button
        variant="outline"
        onClick={() => loginMutation.mutate()}
        disabled={!password}
        className="bg-space-lighter hover:bg-space-dark text-white"
      >
        Login
      </Button>
    </div>
  );
} 