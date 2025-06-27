import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { useToast } from "@/hooks/use-toast";

export interface Patient {
  id: number;
  name: string;
  date_of_birth?: string;
  sex_assigned_at_birth?: string;
  weight?: number;
  chief_complaint?: string;
  user_id: string;
  created_at: string;
}

export interface PatientNote {
  id: number;
  patient_id: number;
  user_id: string;
  type: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Fetch patients from Supabase
  const fetchPatients = useCallback(
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
          .from("patients")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (search) {
          query = query.ilike("name", `%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching patients:", error);
          toast({
            variant: "destructive",
            title: "Error fetching patients",
            description: error.message,
          });
          return;
        }

        setPatients(data || []);
      } catch (error) {
        console.error("Error in fetchPatients:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // Fetch notes for a specific patient
  const fetchPatientNotes = useCallback(async (patientId: number) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("User not authenticated:", userError);
        return;
      }

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("patient_id", patientId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching patient notes:", error);
        return;
      }

      setPatientNotes(data || []);
    } catch (error) {
      console.error("Error in fetchPatientNotes:", error);
    }
  }, []);

  // Select a patient and load their notes
  const selectPatient = useCallback(
    async (patient: Patient) => {
      setSelectedPatient(patient);
      await fetchPatientNotes(patient.id);
    },
    [fetchPatientNotes]
  );

  // Create a new patient
  const createPatient = useCallback(
    async (patientData: Omit<Patient, "id" | "user_id" | "created_at">) => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("User not authenticated:", userError);
          return null;
        }

        const { data, error } = await supabase
          .from("patients")
          .insert([
            {
              ...patientData,
              user_id: user.id,
            },
          ])
          .select()
          .single();

        if (error) {
          console.error("Error creating patient:", error);
          toast({
            variant: "destructive",
            title: "Error creating patient",
            description: error.message,
          });
          return null;
        }

        // Refresh patients list
        await fetchPatients(searchTerm);

        toast({
          variant: "default",
          title: "Patient created successfully",
        });

        return data;
      } catch (error) {
        console.error("Error in createPatient:", error);
        return null;
      }
    },
    [fetchPatients, searchTerm, toast]
  );

  // Update patient information
  const updatePatient = useCallback(
    async (patientId: number, updates: Partial<Patient>) => {
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
          .from("patients")
          .update(updates)
          .eq("id", patientId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error updating patient:", error);
          toast({
            variant: "destructive",
            title: "Error updating patient",
            description: error.message,
          });
          return false;
        }

        // Refresh patients list and update selected patient if needed
        await fetchPatients(searchTerm);
        if (selectedPatient && selectedPatient.id === patientId) {
          const updatedPatient = { ...selectedPatient, ...updates };
          setSelectedPatient(updatedPatient);
        }

        toast({
          variant: "default",
          title: "Patient updated successfully",
        });

        return true;
      } catch (error) {
        console.error("Error in updatePatient:", error);
        return false;
      }
    },
    [fetchPatients, searchTerm, selectedPatient, toast]
  );

  // Delete a patient
  const deletePatient = useCallback(
    async (patientId: number) => {
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
          .from("patients")
          .delete()
          .eq("id", patientId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error deleting patient:", error);
          toast({
            variant: "destructive",
            title: "Error deleting patient",
            description: error.message,
          });
          return false;
        }

        // Clear selected patient if it was deleted
        if (selectedPatient && selectedPatient.id === patientId) {
          setSelectedPatient(null);
          setPatientNotes([]);
        }

        // Refresh patients list
        await fetchPatients(searchTerm);

        toast({
          variant: "default",
          title: "Patient deleted successfully",
        });

        return true;
      } catch (error) {
        console.error("Error in deletePatient:", error);
        return false;
      }
    },
    [fetchPatients, searchTerm, selectedPatient, toast]
  );

  // Search patients
  const searchPatients = useCallback(
    async (search: string) => {
      setSearchTerm(search);
      await fetchPatients(search);
    },
    [fetchPatients]
  );

  // Load patients on mount
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return {
    patients,
    selectedPatient,
    patientNotes,
    isLoading,
    searchTerm,
    fetchPatients,
    selectPatient,
    createPatient,
    updatePatient,
    deletePatient,
    searchPatients,
    clearSelection: () => {
      setSelectedPatient(null);
      setPatientNotes([]);
    },
  };
};
