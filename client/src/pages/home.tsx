import { useState, useMemo } from "react";
import Header from "@/components/header";
import StatsBar from "@/components/stats-bar";
import EpisodeCard from "@/components/episode-card";
import AddLinkModal from "@/components/add-link-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { episodesData } from "@/data/episodes";
import type { EpisodeWithLinks } from "@/types/episode";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [visibleEpisodes, setVisibleEpisodes] = useState(6);

  // Filter episodes based on search query
  const episodes = useMemo(() => {
    if (!searchQuery) return episodesData;
    
    const query = searchQuery.toLowerCase();
    return episodesData.filter(episode => 
      episode.title.toLowerCase().includes(query) ||
      episode.description.toLowerCase().includes(query) ||
      episode.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const displayedEpisodes = episodes.slice(0, visibleEpisodes);
  const hasMoreEpisodes = episodes.length > visibleEpisodes;
  const isLoading = false; // No loading since data is local

  const handleLoadMore = () => {
    setVisibleEpisodes(prev => prev + 6);
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
              <EpisodeCard key={episode.id} episode={episode} />
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

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gradient-to-r from-morty-orange to-rick-green hover:from-rick-green hover:to-morty-orange text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          size="icon"
        >
          <Plus className="text-xl group-hover:rotate-90 transition-transform duration-300" />
        </Button>
      </div>

      {/* Add Link Modal */}
      <AddLinkModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        episodes={episodes}
      />
    </div>
  );
}
