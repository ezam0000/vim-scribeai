import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/auth/authContext";

// KeyPhrase interface matching the database schema
export interface KeyPhrase {
  id: string;
  user_id: string;
  key_phrase: string;
  full_sentence: string;
  created_at: string;
}

// KeyPhrase mappings for quick expansion (key_phrase -> full_sentence)
export type KeyPhraseMappings = Record<string, string>;

export const useKeyPhrases = () => {
  const { user } = useAuth();
  const [keyPhrases, setKeyPhrases] = useState<KeyPhrase[]>([]);
  const [keyPhraseMappings, setKeyPhraseMappings] = useState<KeyPhraseMappings>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mirrors fetchKeyPhraseMappings() from client.js:5459-5480
  const fetchKeyPhrases = useCallback(async () => {
    if (!user?.id) {
      console.log("No user ID available for fetching keyphrases");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching keyphrases for user:", user.id);

      const { data, error: fetchError } = await supabase
        .from("key_phrase_mappings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching keyphrases:", fetchError);
        setError("Failed to fetch keyphrases");
        return;
      }

      console.log("Fetched keyphrases:", data);
      setKeyPhrases(data || []);

      // Convert to mappings object like client.js:5472-5479
      const mappings: KeyPhraseMappings = {};
      if (data) {
        data.forEach((phrase) => {
          mappings[phrase.key_phrase] = phrase.full_sentence;
        });
      }
      setKeyPhraseMappings(mappings);
      console.log("Keyphrase mappings created:", mappings);
    } catch (err) {
      console.error("Error in fetchKeyPhrases:", err);
      setError("An error occurred while fetching keyphrases");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Add new keyphrase
  const addKeyPhrase = useCallback(
    async (keyPhrase: string, fullText: string) => {
      if (!user?.id) {
        setError("User not authenticated");
        return false;
      }

      if (!keyPhrase.trim() || !fullText.trim()) {
        setError("Both key phrase and full text are required");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Adding keyphrase:", { keyPhrase, fullText });

        const { data, error: insertError } = await supabase
          .from("key_phrase_mappings")
          .insert([
            {
              user_id: user.id,
              key_phrase: keyPhrase.trim(),
              full_sentence: fullText.trim(),
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error("Error adding keyphrase:", insertError);
          setError("Failed to add keyphrase");
          return false;
        }

        console.log("Keyphrase added successfully:", data);

        // Refresh the list
        await fetchKeyPhrases();
        return true;
      } catch (err) {
        console.error("Error in addKeyPhrase:", err);
        setError("An error occurred while adding keyphrase");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user?.id, fetchKeyPhrases]
  );

  // Update existing keyphrase
  const updateKeyPhrase = useCallback(
    async (id: string, keyPhrase: string, fullText: string) => {
      if (!user?.id) {
        setError("User not authenticated");
        return false;
      }

      if (!keyPhrase.trim() || !fullText.trim()) {
        setError("Both key phrase and full text are required");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Updating keyphrase:", { id, keyPhrase, fullText });

        const { error: updateError } = await supabase
          .from("key_phrase_mappings")
          .update({
            key_phrase: keyPhrase.trim(),
            full_sentence: fullText.trim(),
          })
          .eq("id", id)
          .eq("user_id", user.id); // Ensure user can only update their own phrases

        if (updateError) {
          console.error("Error updating keyphrase:", updateError);
          setError("Failed to update keyphrase");
          return false;
        }

        console.log("Keyphrase updated successfully");

        // Refresh the list
        await fetchKeyPhrases();
        return true;
      } catch (err) {
        console.error("Error in updateKeyPhrase:", err);
        setError("An error occurred while updating keyphrase");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user?.id, fetchKeyPhrases]
  );

  // Delete keyphrase
  const deleteKeyPhrase = useCallback(
    async (id: string) => {
      if (!user?.id) {
        setError("User not authenticated");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Deleting keyphrase:", id);

        const { error: deleteError } = await supabase
          .from("key_phrase_mappings")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id); // Ensure user can only delete their own phrases

        if (deleteError) {
          console.error("Error deleting keyphrase:", deleteError);
          setError("Failed to delete keyphrase");
          return false;
        }

        console.log("Keyphrase deleted successfully");

        // Refresh the list
        await fetchKeyPhrases();
        return true;
      } catch (err) {
        console.error("Error in deleteKeyPhrase:", err);
        setError("An error occurred while deleting keyphrase");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user?.id, fetchKeyPhrases]
  );

  // Clear error message
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch keyphrases when user changes
  useEffect(() => {
    if (user?.id) {
      fetchKeyPhrases();
    } else {
      setKeyPhrases([]);
      setKeyPhraseMappings({});
    }
  }, [user?.id, fetchKeyPhrases]);

  return {
    keyPhrases,
    keyPhraseMappings,
    loading,
    error,
    fetchKeyPhrases,
    addKeyPhrase,
    updateKeyPhrase,
    deleteKeyPhrase,
    clearError,
  };
};
