import { supabase } from "./supabase";
import { useAuth } from "../auth/authContext";

// TypeScript interfaces for our vim_encounters table
export interface VimEncounter {
  id: string;
  user_id: string;
  encounter_id?: string; // VIM-specific encounter ID
  patient_id?: string; // VIM-specific patient ID

  // Transcript data
  transcript_content?: string;
  transcript_metadata?: {
    duration?: number;
    confidence?: number;
    source?: "live_recording" | "file_upload" | "manual_entry";
    audio_format?: string;
    file_size?: number;
    file_name?: string;
    timestamp?: string;
    [key: string]: any;
  };

  // Clinical note data (equivalent to SOAP content in healthie)
  note_content?: string;
  note_metadata?: {
    generated_at?: string;
    note_type?: "vim" | "soap" | "progress" | "diagnostic" | "psych";
    sections?: {
      subjective?: string;
      objective?: string;
      assessment?: string;
      plan?: string;
      patientInstructions?: string;
    };
    [key: string]: any;
  };

  created_at: string;
  updated_at: string;
}

export interface CreateVimEncounterData {
  encounter_id?: string;
  patient_id?: string;
  transcript_content?: string;
  transcript_metadata?: VimEncounter["transcript_metadata"];
}

export interface UpdateVimEncounterData {
  encounter_id?: string;
  patient_id?: string;
  transcript_content?: string;
  transcript_metadata?: VimEncounter["transcript_metadata"];
  note_content?: string;
  note_metadata?: VimEncounter["note_metadata"];
}

// Create a new vim encounter
export const createVimEncounter = async (
  userId: string,
  encounterData: CreateVimEncounterData
): Promise<VimEncounter | null> => {
  try {
    const { data, error } = await supabase
      .from("vim_encounters")
      .insert({
        user_id: userId,
        encounter_id: encounterData.encounter_id || null,
        patient_id: encounterData.patient_id || null,
        transcript_content: encounterData.transcript_content || null,
        transcript_metadata: encounterData.transcript_metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating vim encounter:", error);
      return null;
    }

    console.log("✅ Created vim encounter:", data.id);
    return data as VimEncounter;
  } catch (err) {
    console.error("Error in createVimEncounter:", err);
    return null;
  }
};

// Save transcript to existing vim encounter
export const saveVimTranscript = async (
  userId: string,
  encounterId: string,
  transcriptContent: string,
  metadata?: VimEncounter["transcript_metadata"]
): Promise<VimEncounter | null> => {
  try {
    const { data, error } = await supabase
      .from("vim_encounters")
      .update({
        transcript_content: transcriptContent,
        transcript_metadata: metadata || {},
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("id", encounterId)
      .select()
      .single();

    if (error) {
      console.error("Error saving vim transcript:", error);
      return null;
    }

    console.log(
      "💾 Saved vim transcript:",
      transcriptContent.length,
      "characters"
    );
    return data as VimEncounter;
  } catch (err) {
    console.error("Error in saveVimTranscript:", err);
    return null;
  }
};

// Save clinical note to existing vim encounter
export const saveVimNote = async (
  userId: string,
  encounterId: string,
  noteContent: string,
  metadata?: VimEncounter["note_metadata"]
): Promise<VimEncounter | null> => {
  try {
    const { data, error } = await supabase
      .from("vim_encounters")
      .update({
        note_content: noteContent,
        note_metadata: metadata || {},
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("id", encounterId)
      .select()
      .single();

    if (error) {
      console.error("Error saving vim note:", error);
      return null;
    }

    console.log("📋 Saved vim note:", noteContent.length, "characters");
    return data as VimEncounter;
  } catch (err) {
    console.error("Error in saveVimNote:", err);
    return null;
  }
};

// Get all vim encounters for a user
export const getVimEncounters = async (
  userId: string,
  options?: {
    encounterId?: string;
    patientId?: string;
    hasTranscript?: boolean;
    hasNote?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<VimEncounter[]> => {
  try {
    let query = supabase
      .from("vim_encounters")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Apply filters if provided
    if (options?.encounterId) {
      query = query.eq("encounter_id", options.encounterId);
    }
    if (options?.patientId) {
      query = query.eq("patient_id", options.patientId);
    }
    if (options?.hasTranscript) {
      query = query.not("transcript_content", "is", null);
    }
    if (options?.hasNote) {
      query = query.not("note_content", "is", null);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching vim encounters:", error);
      return [];
    }

    return data as VimEncounter[];
  } catch (err) {
    console.error("Error in getVimEncounters:", err);
    return [];
  }
};

// Get a specific vim encounter by ID
export const getVimEncounterById = async (
  userId: string,
  encounterId: string
): Promise<VimEncounter | null> => {
  try {
    const { data, error } = await supabase
      .from("vim_encounters")
      .select("*")
      .eq("user_id", userId)
      .eq("id", encounterId)
      .single();

    if (error) {
      console.error("Error fetching vim encounter:", error);
      return null;
    }

    return data as VimEncounter;
  } catch (err) {
    console.error("Error in getVimEncounterById:", err);
    return null;
  }
};

// Update vim encounter
export const updateVimEncounter = async (
  userId: string,
  encounterId: string,
  updateData: UpdateVimEncounterData
): Promise<VimEncounter | null> => {
  try {
    const { data, error } = await supabase
      .from("vim_encounters")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("id", encounterId)
      .select()
      .single();

    if (error) {
      console.error("Error updating vim encounter:", error);
      return null;
    }

    return data as VimEncounter;
  } catch (err) {
    console.error("Error in updateVimEncounter:", err);
    return null;
  }
};

// Delete vim encounter
export const deleteVimEncounter = async (
  userId: string,
  encounterId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("vim_encounters")
      .delete()
      .eq("user_id", userId)
      .eq("id", encounterId);

    if (error) {
      console.error("Error deleting vim encounter:", error);
      return false;
    }

    console.log("🗑️ Deleted vim encounter:", encounterId);
    return true;
  } catch (err) {
    console.error("Error in deleteVimEncounter:", err);
    return false;
  }
};

// Search vim encounters by content
export const searchVimEncounters = async (
  userId: string,
  searchTerm: string,
  options?: {
    encounterId?: string;
    patientId?: string;
    searchInTranscript?: boolean;
    searchInNote?: boolean;
    limit?: number;
  }
): Promise<VimEncounter[]> => {
  try {
    let query = supabase
      .from("vim_encounters")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Apply filters if provided
    if (options?.encounterId) {
      query = query.eq("encounter_id", options.encounterId);
    }
    if (options?.patientId) {
      query = query.eq("patient_id", options.patientId);
    }

    // Build search conditions
    if (options?.searchInTranscript && options?.searchInNote) {
      query = query.or(
        `transcript_content.ilike.%${searchTerm}%,note_content.ilike.%${searchTerm}%`
      );
    } else if (options?.searchInTranscript) {
      query = query.ilike("transcript_content", `%${searchTerm}%`);
    } else if (options?.searchInNote) {
      query = query.ilike("note_content", `%${searchTerm}%`);
    } else {
      // Search in both by default
      query = query.or(
        `transcript_content.ilike.%${searchTerm}%,note_content.ilike.%${searchTerm}%`
      );
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error searching vim encounters:", error);
      return [];
    }

    return data as VimEncounter[];
  } catch (err) {
    console.error("Error in searchVimEncounters:", err);
    return [];
  }
};

// React hook for easy use in components
export const useVimEncounters = () => {
  const { userId } = useAuth();

  const createNewVimEncounter = (encounterData: CreateVimEncounterData) => {
    if (!userId) return Promise.resolve(null);
    return createVimEncounter(userId, encounterData);
  };

  const getVimEncountersList = (
    options?: Parameters<typeof getVimEncounters>[1]
  ) => {
    if (!userId) return Promise.resolve([]);
    return getVimEncounters(userId, options);
  };

  const getVimEncounter = (encounterId: string) => {
    if (!userId) return Promise.resolve(null);
    return getVimEncounterById(userId, encounterId);
  };

  const updateVimEncounterData = (
    encounterId: string,
    updateData: UpdateVimEncounterData
  ) => {
    if (!userId) return Promise.resolve(null);
    return updateVimEncounter(userId, encounterId, updateData);
  };

  const saveVimEncounterTranscript = (
    encounterId: string,
    content: string,
    metadata?: VimEncounter["transcript_metadata"]
  ) => {
    if (!userId) return Promise.resolve(null);
    return saveVimTranscript(userId, encounterId, content, metadata);
  };

  const saveVimEncounterNote = (
    encounterId: string,
    content: string,
    metadata?: VimEncounter["note_metadata"]
  ) => {
    if (!userId) return Promise.resolve(null);
    return saveVimNote(userId, encounterId, content, metadata);
  };

  const deleteVimEncounterData = (encounterId: string) => {
    if (!userId) return Promise.resolve(false);
    return deleteVimEncounter(userId, encounterId);
  };

  const searchVimEncounterData = (
    searchTerm: string,
    options?: Parameters<typeof searchVimEncounters>[2]
  ) => {
    if (!userId) return Promise.resolve([]);
    return searchVimEncounters(userId, searchTerm, options);
  };

  return {
    createNewVimEncounter,
    getVimEncountersList,
    getVimEncounter,
    updateVimEncounterData,
    saveVimEncounterTranscript,
    saveVimEncounterNote,
    deleteVimEncounterData,
    searchVimEncounterData,
  };
};
