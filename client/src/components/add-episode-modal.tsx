import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  code: z.string().min(1, "Episode code is required (e.g., S08E01)"),
  title: z.string().min(1, "Episode title is required"),
  description: z.string().min(1, "Episode description is required"),
  episodeNumber: z.coerce.number().min(1, "Episode number must be at least 1"),
});

type FormData = z.infer<typeof formSchema>;

interface AddEpisodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEpisodeAdded: () => void;
}

export default function AddEpisodeModal({ isOpen, onClose, onEpisodeAdded }: AddEpisodeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      title: "",
      description: "",
      episodeNumber: 1,
    },
  });

  const addEpisodeMutation = useMutation({
    mutationFn: async (episodeData: FormData) => {
      const response = await fetch("/api/episodes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(episodeData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add episode");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      toast({
        title: "Success!",
        description: "Episode added successfully!",
      });
      form.reset();
      onClose();
      onEpisodeAdded();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add episode",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormData) => {
    addEpisodeMutation.mutate(values);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-space-surface border-space-lighter max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Add New Episode
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Episode Code */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Episode Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., S08E01"
                      className="bg-space-lighter border-gray-600 text-white placeholder-gray-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Episode Number */}
            <FormField
              control={form.control}
              name="episodeNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Episode Number</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1"
                      className="bg-space-lighter border-gray-600 text-white placeholder-gray-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Episode Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Episode Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Summer of All Fears"
                      className="bg-space-lighter border-gray-600 text-white placeholder-gray-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Episode Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter episode description..."
                      className="bg-space-lighter border-gray-600 text-white placeholder-gray-400 min-h-[80px]"
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
                disabled={addEpisodeMutation.isPending}
                className="flex-1 bg-gradient-to-r from-portal-blue to-rick-green hover:opacity-90 text-white"
              >
                {addEpisodeMutation.isPending ? "Adding..." : "Add Episode"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}