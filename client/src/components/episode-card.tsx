import { ExternalLink, Link as LinkIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { EpisodeWithLinks } from "@/types/episode";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EpisodeCardProps {
  episode: EpisodeWithLinks;
  isAdmin?: boolean;
}

export default function EpisodeCard({ episode, isAdmin = false }: EpisodeCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteEpisodeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/episodes/${episode.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete episode");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      toast({
        title: "Success!",
        description: "Episode deleted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete episode",
        variant: "destructive",
      });
    },
  });

  const convertToStreamableUrl = (url: string) => {
    // Convert Google Drive share links to direct streaming links
    if (url.includes('drive.google.com')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    return url;
  };

  const handleStreamClick = (url: string, sourceName: string) => {
    try {
      const streamableUrl = convertToStreamableUrl(url);
      window.open(streamableUrl, '_blank', 'noopener,noreferrer');
      toast({
        title: "Opening stream",
        description: `Streaming ${sourceName} in new tab...`,
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
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-space-surface border-space-lighter">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Delete Episode</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      Are you sure you want to delete this episode? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-space-lighter text-white hover:bg-space-dark">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteEpisodeMutation.mutate()}
                      className="bg-red-500 text-white hover:bg-red-600"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <div className="flex items-center space-x-1">
              <LinkIcon className="text-rick-green text-sm h-4 w-4" />
              <span className="text-xs text-rick-green font-medium">
                {episode.links.length} link{episode.links.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-400 mb-4 line-clamp-3">
          {episode.description}
        </p>
        
        {/* Quick Links */}
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
