import { useQuery } from "@tanstack/react-query";
import type { EpisodeWithLinks } from "@shared/schema";

interface StatsBarProps {
  episodes: EpisodeWithLinks[];
}

export default function StatsBar({ episodes }: StatsBarProps) {
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const response = await fetch("/api/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const totalLinks = episodes.reduce((sum, episode) => sum + episode.links.length, 0);

  return (
    <div className="mb-8">
      <div className="bg-space-surface rounded-xl p-6 border border-space-lighter">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-portal-blue">
              {stats?.totalEpisodes || episodes.length}
            </div>
            <div className="text-sm text-gray-400">Total Episodes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-rick-green">
              {stats?.totalLinks || totalLinks}
            </div>
            <div className="text-sm text-gray-400">Available Links</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-morty-orange">
              {stats?.lastUpdated || "Recently"}
            </div>
            <div className="text-sm text-gray-400">Last Updated</div>
          </div>
        </div>
      </div>
    </div>
  );
}
