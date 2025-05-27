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
import { format } from "date-fns";
import { BiLinkExternal } from "react-icons/bi";
import { FiTrash2 } from "react-icons/fi";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Separator } from "./ui/separator";

interface EpisodeCardProps {
  episode: EpisodeWithLinks;
  isAdmin?: boolean;
  onDelete?: (episodeId: number) => void;
  onDeleteTemporary?: (episodeId: number) => void;
  onEpisodeDeleted?: () => void;
}

export default function EpisodeCard({ episode, isAdmin = false, onDelete, onDeleteTemporary, onEpisodeDeleted }: EpisodeCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingTemporary, setIsDeletingTemporary] = useState(false);

  const deleteEpisodeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/episodes/${episode.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete episode");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
      queryClient.invalidateQueries({ queryKey: ["episodes", episode.id] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({
        title: "Success!",
        description: "Episode deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete episode.",
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

  const handleTemporaryDelete = async () => {
    if (window.confirm(`Are you sure you want to DELETE episode "${episode.title}"?\n\nWARNING: This uses a temporary, insecure endpoint and should be removed from code later.`)) {
      setIsDeletingTemporary(true);
      try {
        const response = await fetch(`/api/temp/delete-episode/${episode.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          console.log(`Episode ${episode.id} deleted successfully via temporary endpoint.`);
          toast({
            title: "Success!",
            description: "Episode deleted successfully (temporary)",
          });
          onDeleteTemporary?.(episode.id);
        } else {
          const errorData = await response.json();
          console.error('Failed to delete episode via temporary endpoint:', errorData.message);
          toast({
            title: "Error",
            description: errorData.message || 'Failed to delete episode (temporary).',
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error deleting episode via temporary endpoint:', error);
        toast({
          title: "Error",
          description: 'An error occurred while deleting the episode (temporary).',
          variant: "destructive",
        });
      } finally {
        setIsDeletingTemporary(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) return;

    if (window.confirm(`Are you sure you want to delete episode "${episode.title}"?`)) {
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/episodes/${episode.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to delete episode:', error.message);
          alert(`Failed to delete episode: ${error.message}`);
        } else {
          console.log('Episode deleted successfully');
          alert('Episode deleted successfully!');
          deleteEpisodeMutation.mutate();
          if (onEpisodeDeleted) {
            onEpisodeDeleted();
          }
        }
      } catch (error) {
        console.error('Error deleting episode:', error);
        alert('An error occurred while trying to delete the episode.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const displayedLinks = episode.links.slice(0, 2);
  const hasMoreLinks = episode.links.length > 2;

  return (
    <Card className="bg-space-surface text-white border-space-lighter overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold text-rick-green">{episode.code}</CardTitle>
            <CardDescription className="text-gray-400">{episode.title}</CardDescription>
          </div>
          {isAdmin && (
            <Button 
              variant="destructive" 
              size="icon" 
              onClick={handleDelete}
              className="flex-shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-300 mb-4">{episode.description}</p>
        <Separator className="bg-space-lighter mb-4" />
        {episode.links && episode.links.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="links">
              <AccordionTrigger className="text-portal-blue hover:underline-none">Streaming Links ({episode.links.length})</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc list-inside text-gray-300">
                  {episode.links.map((link) => (
                    <li key={link.id} className="mb-1 flex items-center">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline flex items-center"
                      >
                        {link.sourceName} - {link.quality}
                        <ExternalLink className="ml-1 h-3 w-3 inline" />
                      </a>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <p className="text-sm text-gray-400">No streaming links available.</p>
        )}
      </CardContent>
    </Card>
  );
}
