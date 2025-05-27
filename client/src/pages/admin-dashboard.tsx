import React from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import EpisodeCard from "@/components/episode-card"; // Will reuse the card for display/delete
import AddEpisodeModal from "@/components/add-episode-modal";
import AddLinkModal from "@/components/add-link-modal";
import { Plus, Tv, Link } from "lucide-react";
import type { EpisodeWithLinks } from "@shared/schema";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [isAddEpisodeModalOpen, setIsAddEpisodeModalOpen] = React.useState(false);
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = React.useState(false);
  const [showAddMenu, setShowAddMenu] = React.useState(false);

  // Fetch episodes with links for the dashboard
  const { data: episodes = [], isLoading, error } = useQuery<EpisodeWithLinks[]>({
    queryKey: ["/api/episodes"],
    queryFn: async () => {
      const response = await fetch("/api/episodes");
      if (!response.ok) throw new Error("Failed to fetch episodes");
      return response.json();
    },
  });

  // Function to refetch episodes after adding/deleting
  const refetchEpisodes = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
  };

  if (isLoading) return <div className="text-white p-8">Loading episodes...</div>;
  if (error) return <div className="text-red-500 p-8">An error occurred: {error.message}</div>;

  return (
    <div className="min-h-screen bg-space-dark text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

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
        {episodes.length > 0 ? (
          episodes.map((episode) => (
            <EpisodeCard 
              key={episode.id} 
              episode={episode} 
              isAdmin={true} // Always show delete button in admin dashboard
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-400 text-lg">
              No episodes available in the library.
            </p>
          </div>
        )}
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