import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { useToast } from "@/hooks/use-toast";

export interface VimEncounter {
  id: string;
  user_id: string;
  encounter_id?: string;
  patient_id?: string;
  transcript_content?: string;
  transcript_metadata?: any;
  note_content?: string;
  note_metadata?: any;
  created_at: string;
  updated_at: string;
}

export const useVimEncounters = () => {
  const [encounters, setEncounters] = useState<VimEncounter[]>([]);
  const [selectedEncounter, setSelectedEncounter] =
    useState<VimEncounter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Fetch encounters from Supabase
  const fetchEncounters = useCallback(
    async (search = "") => {
      try {
        setIsLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("User not authenticated:", userError);
          return;
        }

        let query = supabase
          .from("vim_encounters")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (search) {
          query = query.or(
            `transcript_content.ilike.%${search}%,note_content.ilike.%${search}%`
          );
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching encounters:", error);
          toast({
            variant: "destructive",
            title: "Error fetching encounters",
            description: error.message,
          });
          return;
        }

        setEncounters(data || []);
      } catch (error) {
        console.error("Error in fetchEncounters:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // Select an encounter
  const selectEncounter = useCallback(
    async (encounter: VimEncounter) => {
      setSelectedEncounter(encounter);
      toast({
        variant: "default",
        title: "Encounter selected",
        description: `Selected encounter from ${new Date(
          encounter.created_at
        ).toLocaleDateString()}`,
      });
    },
    [toast]
  );

  // Delete an encounter
  const deleteEncounter = useCallback(
    async (encounterId: string) => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("User not authenticated:", userError);
          return false;
        }

        const { error } = await supabase
          .from("vim_encounters")
          .delete()
          .eq("id", encounterId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error deleting encounter:", error);
          toast({
            variant: "destructive",
            title: "Error deleting encounter",
            description: error.message,
          });
          return false;
        }

        // Clear selected encounter if it was deleted
        if (selectedEncounter && selectedEncounter.id === encounterId) {
          setSelectedEncounter(null);
        }

        // Refresh encounters list
        await fetchEncounters(searchTerm);

        toast({
          variant: "default",
          title: "Encounter deleted successfully",
        });

        return true;
      } catch (error) {
        console.error("Error in deleteEncounter:", error);
        return false;
      }
    },
    [fetchEncounters, searchTerm, selectedEncounter, toast]
  );

  // Search encounters
  const searchEncounters = useCallback(
    async (search: string) => {
      setSearchTerm(search);
      await fetchEncounters(search);
    },
    [fetchEncounters]
  );

  // Get encounter summary for display
  const getEncounterSummary = useCallback((encounter: VimEncounter) => {
    const date = new Date(encounter.created_at).toLocaleDateString();
    const time = new Date(encounter.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Extract first few words of transcript for preview
    const transcriptPreview = encounter.transcript_content
      ? encounter.transcript_content.substring(0, 50) +
        (encounter.transcript_content.length > 50 ? "..." : "")
      : "No transcript";

    const hasNote = !!encounter.note_content;

    return {
      date,
      time,
      transcriptPreview,
      hasNote,
      title: `Encounter ${date} ${time}`,
    };
  }, []);

  // Load encounters on mount
  useEffect(() => {
    fetchEncounters();
  }, [fetchEncounters]);

  return {
    encounters,
    selectedEncounter,
    isLoading,
    searchTerm,
    fetchEncounters,
    selectEncounter,
    deleteEncounter,
    searchEncounters,
    getEncounterSummary,
    clearSelection: () => setSelectedEncounter(null),
  };
};
