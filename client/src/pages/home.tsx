import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import StatsBar from "@/components/stats-bar";
import EpisodeCard from "@/components/episode-card";
import AddLinkModal from "@/components/add-link-modal";
import AddEpisodeModal from "@/components/add-episode-modal";
import { Button } from "@/components/ui/button";
import { Plus, Tv, Link } from "lucide-react";
import type { EpisodeWithLinks } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const [isAddEpisodeModalOpen, setIsAddEpisodeModalOpen] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [visibleEpisodes, setVisibleEpisodes] = useState(6);

  // Fetch episodes with links from the database
  const { data: episodes = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/episodes"],
    queryFn: async () => {
      const response = await fetch("/api/episodes");
      if (!response.ok) throw new Error("Failed to fetch episodes");
      return response.json() as EpisodeWithLinks[];
    },
  });

  // Filter episodes based on search query
  const filteredEpisodes = useMemo(() => {
    if (!searchQuery) return episodes;
    
    const query = searchQuery.toLowerCase();
    return episodes.filter(episode => 
      episode.title.toLowerCase().includes(query) ||
      episode.description.toLowerCase().includes(query) ||
      episode.code.toLowerCase().includes(query)
    );
  }, [searchQuery, episodes]);

  const displayedEpisodes = filteredEpisodes.slice(0, visibleEpisodes);
  const hasMoreEpisodes = filteredEpisodes.length > visibleEpisodes;

  const handleLoadMore = () => {
    setVisibleEpisodes(prev => prev + 6);
  };

  const handleAddLink = () => {
    refetch(); // Refresh the episodes list after adding a link
  };

  return (
    <div className="min-h-screen bg-space-dark text-white">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className="container mx-auto px-4 py-8">
        <StatsBar episodes={episodes} />

        {/* Episodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-space-surface rounded-xl border border-space-lighter p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-space-lighter rounded mb-2"></div>
                  <div className="h-6 bg-space-lighter rounded mb-4"></div>
                  <div className="h-16 bg-space-lighter rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-8 bg-space-lighter rounded"></div>
                    <div className="h-8 bg-space-lighter rounded"></div>
                  </div>
                </div>
              </div>
            ))
          ) : displayedEpisodes.length > 0 ? (
            displayedEpisodes.map((episode) => (
              <EpisodeCard 
                key={episode.id} 
                episode={episode} 
                isAdmin={true} // TODO: Replace with actual admin check
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400 text-lg">
                {searchQuery ? "No episodes found matching your search." : "No episodes available."}
              </p>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {hasMoreEpisodes && !isLoading && (
          <div className="text-center mt-12">
            <Button
              onClick={handleLoadMore}
              variant="outline"
              className="bg-space-surface hover:bg-space-lighter border-space-lighter hover:border-portal-blue text-white px-8 py-3"
            >
              Load More Episodes
            </Button>
          </div>
        )}
      </main>

      {/* Floating Action Button with Menu */}
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
              disabled={episodes.length === 0}
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

      {/* Add Episode Modal */}
      <AddEpisodeModal 
        isOpen={isAddEpisodeModalOpen} 
        onClose={() => setIsAddEpisodeModalOpen(false)}
      />

      {/* Add Link Modal */}
      <AddLinkModal 
        isOpen={isAddLinkModalOpen} 
        onClose={() => setIsAddLinkModalOpen(false)}
        episodes={episodes}
        onAddLink={handleAddLink}
      />
    </div>
  );
}
