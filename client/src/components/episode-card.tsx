import { ExternalLink, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { EpisodeWithLinks } from "@shared/schema";

interface EpisodeCardProps {
  episode: EpisodeWithLinks;
}

export default function EpisodeCard({ episode }: EpisodeCardProps) {
  const { toast } = useToast();

  const handleStreamClick = (url: string, sourceName: string) => {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
      toast({
        title: "Opening stream",
        description: `Opening ${sourceName} in new tab...`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open streaming link",
        variant: "destructive",
      });
    }
  };

  const displayedLinks = episode.links.slice(0, 2);
  const hasMoreLinks = episode.links.length > 2;

  return (
    <div className="bg-space-surface rounded-xl border border-space-lighter hover:border-portal-blue transition-all duration-300 hover:shadow-lg hover:shadow-portal-blue/20 group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs font-mono text-portal-blue mb-1">
              {episode.code}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-portal-blue transition-colors">
              {episode.title}
            </h3>
          </div>
          <div className="flex items-center space-x-1">
            <LinkIcon className="text-rick-green text-sm h-4 w-4" />
            <span className="text-xs text-rick-green font-medium">
              {episode.links.length} link{episode.links.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        <p className="text-sm text-gray-400 mb-4 line-clamp-3">
          {episode.description}
        </p>
        
        {/* Quick Links */}
        {episode.links.length > 0 && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Quality</span>
              <span className="text-gray-400">Source</span>
              <span className="text-gray-400">Action</span>
            </div>
            
            {displayedLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between py-2 px-3 bg-space-lighter rounded-lg hover:bg-space-dark transition-colors"
              >
                <span className="text-xs font-medium text-white">
                  {link.quality}
                </span>
                <span className="text-xs text-gray-400">
                  {link.sourceName}
                </span>
                <button
                  onClick={() => handleStreamClick(link.url, link.sourceName)}
                  className="text-portal-blue hover:text-white transition-colors"
                >
                  <ExternalLink className="text-xs h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <Button
          className="w-full bg-gradient-to-r from-portal-blue to-rick-green text-white py-2 px-4 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          onClick={() => {
            if (episode.links.length === 0) {
              toast({
                title: "No links available",
                description: "This episode doesn't have any streaming links yet.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "All links",
                description: `Showing all ${episode.links.length} available links for ${episode.title}`,
              });
            }
          }}
        >
          {episode.links.length === 0 
            ? "No Links Available" 
            : hasMoreLinks 
              ? `View All ${episode.links.length} Links`
              : "View Links"
          }
        </Button>
      </div>
    </div>
  );
}
