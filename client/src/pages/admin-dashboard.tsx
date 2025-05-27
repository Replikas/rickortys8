import React from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import EpisodeCard from "@/components/episode-card"; // Will reuse the card for display/delete
import AddEpisodeModal from "@/components/add-episode-modal";
import AddLinkModal from "@/components/add-link-modal";
import { Plus, Tv, Link } from "lucide-react";
import type { EpisodeWithLinks } from "@shared/schema";
import { useAuth0 } from "@auth0/auth0-react";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [isAddEpisodeModalOpen, setIsAddEpisodeModalOpen] = React.useState(false);
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = React.useState(false);
  const [showAddMenu, setShowAddMenu] = React.useState(false);
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth0();
  const [, navigate] = useLocation();

  // Fetch episodes with links for the dashboard
  const { data: episodes = [], isLoading: episodesLoading } = useQuery<EpisodeWithLinks[]>({
    queryKey: ["/api/episodes"],
    queryFn: async (): Promise<EpisodeWithLinks[]> => {
      const response = await fetch("/api/episodes");
      if (!response.ok) throw new Error("Failed to fetch episodes");
      return response.json();
    },
  });

  // Function to refetch episodes after adding/deleting
  const refetchEpisodes = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    navigate("/admin/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-space-dark text-white p-8">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button
            onClick={() => logout()}
            variant="outline"
            className="bg-space-surface hover:bg-space-lighter border-space-lighter text-white"
          >
            Logout
          </Button>
        </div>

        {/* Floating Action Button with Menu for adding */}
        <div className="fixed bottom-6 right-6 z-50">
          {showAddMenu && (
            <div className="absolute bottom-16 right-0 space-y-3 mb-2">
              <Button
                onClick={() => {
                  setIsAddEpisodeModalOpen(true);
                  setShowAddMenu(false);
                }}
                className="bg-portal-blue hover:bg-portal-blue/80 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2"
              >
                <Tv className="w-4 h-4" />
                <span className="whitespace-nowrap">Add Episode</span>
              </Button>
              <Button
                onClick={() => {
                  setIsAddLinkModalOpen(true);
                  setShowAddMenu(false);
                }}
                className="bg-rick-green hover:bg-rick-green/80 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2"
                disabled={episodes.length === 0} // Disable if no episodes to link to
              >
                <Link className="w-4 h-4" />
                <span className="whitespace-nowrap">Add Link</span>
              </Button>
            </div>
          )}
          
          <Button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="bg-gradient-to-r from-morty-orange to-rick-green hover:from-rick-green hover:to-morty-orange text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            size="icon"
          >
            <Plus className={`text-xl transition-transform duration-300 ${showAddMenu ? 'rotate-45' : ''}`} />
          </Button>
        </div>

        {/* Episodes Grid for management */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {episodesLoading ? (
            <div>Loading episodes...</div>
          ) : episodes.length > 0 ? (
            episodes.map((episode) => (
              <EpisodeCard 
                key={episode.id} 
                episode={episode}
                isAdmin={true}
                onEpisodeDeleted={refetchEpisodes}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400 text-lg">No episodes available.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals for adding */}
      <AddEpisodeModal 
        isOpen={isAddEpisodeModalOpen} 
        onClose={() => setIsAddEpisodeModalOpen(false)}
        onEpisodeAdded={refetchEpisodes} // Refetch after adding episode
      />

      <AddLinkModal 
        isOpen={isAddLinkModalOpen} 
        onClose={() => setIsAddLinkModalOpen(false)}
        episodes={episodes} // Pass episodes to link modal
        onAddLink={refetchEpisodes} // Refetch after adding link
      />

    </div>
  );
} 