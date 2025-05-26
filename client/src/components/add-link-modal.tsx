import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { EpisodeWithLinks, InsertStreamingLink } from "@shared/schema";

const formSchema = z.object({
  episodeId: z.string().transform(Number),
  url: z.string().url("Please enter a valid URL"),
  quality: z.enum(["4K", "1080p", "720p", "480p"]),
  sourceName: z.string().min(1, "Source name is required"),
});

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  episodes: EpisodeWithLinks[];
}

export default function AddLinkModal({ isOpen, onClose, episodes }: AddLinkModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      episodeId: "",
      url: "",
      quality: "1080p",
      sourceName: "",
    },
  });

  const addLinkMutation = useMutation({
    mutationFn: async (data: InsertStreamingLink) => {
      const response = await apiRequest("POST", "/api/streaming-links", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success!",
        description: "Streaming link added successfully!",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add streaming link",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const data: InsertStreamingLink = {
      episodeId: values.episodeId,
      url: values.url,
      quality: values.quality,
      sourceName: values.sourceName,
    };
    addLinkMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-space-surface border-space-lighter max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white">
              Add Streaming Link
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Episode Selection */}
            <FormField
              control={form.control}
              name="episodeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Episode</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-space-lighter border-gray-600 text-white">
                        <SelectValue placeholder="Select an episode..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-space-lighter border-gray-600">
                      {episodes.map((episode) => (
                        <SelectItem 
                          key={episode.id} 
                          value={episode.id.toString()}
                          className="text-white hover:bg-space-dark"
                        >
                          {episode.code} - {episode.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Streaming URL */}
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Streaming URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/stream/episode"
                      className="bg-space-lighter border-gray-600 text-white placeholder-gray-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quality */}
            <FormField
              control={form.control}
              name="quality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Quality</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-space-lighter border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-space-lighter border-gray-600">
                      <SelectItem value="4K" className="text-white hover:bg-space-dark">4K</SelectItem>
                      <SelectItem value="1080p" className="text-white hover:bg-space-dark">1080p</SelectItem>
                      <SelectItem value="720p" className="text-white hover:bg-space-dark">720p</SelectItem>
                      <SelectItem value="480p" className="text-white hover:bg-space-dark">480p</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Source Name */}
            <FormField
              control={form.control}
              name="sourceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Source Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., StreamSite, VideoHub"
                      className="bg-space-lighter border-gray-600 text-white placeholder-gray-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 bg-space-lighter hover:bg-space-dark text-white border-gray-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addLinkMutation.isPending}
                className="flex-1 bg-gradient-to-r from-portal-blue to-rick-green hover:opacity-90 text-white"
              >
                {addLinkMutation.isPending ? "Adding..." : "Add Link"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
