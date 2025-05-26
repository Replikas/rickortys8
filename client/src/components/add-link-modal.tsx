import { useState } from "react";
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
import type { EpisodeWithLinks, StreamingLink } from "@/types/episode";

const formSchema = z.object({
  episodeId: z.string().min(1, "Please select an episode"),
  url: z.string().url("Please enter a valid URL"),
  quality: z.enum(["4K", "1080p", "720p", "480p"]),
  platform: z.string().min(1, "Platform name is required"),
});

type FormData = z.infer<typeof formSchema>;

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  episodes: EpisodeWithLinks[];
  onAddLink: (link: Omit<StreamingLink, 'id'>) => void;
}

export default function AddLinkModal({ isOpen, onClose, episodes, onAddLink }: AddLinkModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      episodeId: "",
      url: "",
      quality: "1080p",
      platform: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    try {
      const newLink: Omit<StreamingLink, 'id'> = {
        episodeId: parseInt(values.episodeId),
        platform: values.platform,
        url: values.url,
        quality: values.quality,
      };
      
      onAddLink(newLink);
      
      toast({
        title: "Success!",
        description: "Streaming link added successfully!",
      });
      
      form.reset();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add streaming link",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
                      placeholder="https://drive.google.com/file/d/..."
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

            {/* Platform Name */}
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Platform Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Google Drive, Mega, Dropbox"
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
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-portal-blue to-rick-green hover:opacity-90 text-white"
              >
                {isSubmitting ? "Adding..." : "Add Link"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}