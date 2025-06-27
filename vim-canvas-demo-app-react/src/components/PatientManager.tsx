import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { usePatients, Patient } from "@/hooks/usePatients";
import { useToast } from "@/hooks/use-toast";

export const PatientManager: React.FC = () => {
  const {
    patients,
    selectedPatient,
    patientNotes,
    isLoading,
    searchTerm,
    selectPatient,
    createPatient,
    updatePatient,
    deletePatient,
    searchPatients,
    clearSelection,
  } = usePatients();

  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [searchInput, setSearchInput] = useState(searchTerm);

  // Form state for adding/editing patients
  const [formData, setFormData] = useState({
    name: "",
    date_of_birth: "",
    sex_assigned_at_birth: "",
    weight: "",
    chief_complaint: "",
  });

  const { toast } = useToast();

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    searchPatients(value);
  };

  // Handle patient selection
  const handleSelectPatient = async (patient: Patient) => {
    await selectPatient(patient);
    toast({
      variant: "default",
      title: "Patient selected",
      description: `Selected ${patient.name}`,
    });
  };

  // Handle adding new patient
  const handleAddPatient = async () => {
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter a patient name",
      });
      return;
    }

    const patientData = {
      name: formData.name.trim(),
      date_of_birth: formData.date_of_birth || undefined,
      sex_assigned_at_birth: formData.sex_assigned_at_birth || undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      chief_complaint: formData.chief_complaint || undefined,
    };

    const newPatient = await createPatient(patientData);
    if (newPatient) {
      // Reset form
      setFormData({
        name: "",
        date_of_birth: "",
        sex_assigned_at_birth: "",
        weight: "",
        chief_complaint: "",
      });
      setShowAddForm(false);
    }
  };

  // Handle editing patient
  const handleEditPatient = async () => {
    if (!selectedPatient) return;

    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter a patient name",
      });
      return;
    }

    const updates = {
      name: formData.name.trim(),
      date_of_birth: formData.date_of_birth || undefined,
      sex_assigned_at_birth: formData.sex_assigned_at_birth || undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      chief_complaint: formData.chief_complaint || undefined,
    };

    const success = await updatePatient(selectedPatient.id, updates);
    if (success) {
      setShowEditForm(false);
    }
  };

  // Handle deleting patient
  const handleDeletePatient = async (patient: Patient) => {
    if (
      window.confirm(
        `Are you sure you want to delete patient "${patient.name}"? This action cannot be undone.`
      )
    ) {
      await deletePatient(patient.id);
    }
  };

  // Start editing - populate form with current patient data
  const startEditing = () => {
    if (selectedPatient) {
      setFormData({
        name: selectedPatient.name,
        date_of_birth: selectedPatient.date_of_birth || "",
        sex_assigned_at_birth: selectedPatient.sex_assigned_at_birth || "",
        weight: selectedPatient.weight?.toString() || "",
        chief_complaint: selectedPatient.chief_complaint || "",
      });
      setShowEditForm(true);
    }
  };

  // Cancel form
  const cancelForm = () => {
    setFormData({
      name: "",
      date_of_birth: "",
      sex_assigned_at_birth: "",
      weight: "",
      chief_complaint: "",
    });
    setShowAddForm(false);
    setShowEditForm(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between p-4 h-auto"
            style={{
              backgroundColor: "#68e095",
              borderColor: "#68e095",
              color: "white",
            }}
          >
            <span className="font-medium">
              Patients ({patients.length})
              {selectedPatient && ` - Selected: ${selectedPatient.name}`}
            </span>
            {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4 pt-4">
          {/* Search and Controls */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Search patients..."
                value={searchInput}
                onChange={handleSearch}
                className="flex-1"
              />
              <Button
                onClick={() => setShowAddForm(true)}
                size="sm"
                style={{
                  backgroundColor: "#335df3",
                  borderColor: "#335df3",
                  color: "white",
                }}
              >
                Add Patient
              </Button>
            </div>

            {selectedPatient && (
              <div className="flex gap-2">
                <Button onClick={startEditing} size="sm" variant="outline">
                  Edit
                </Button>
                <Button
                  onClick={() => handleDeletePatient(selectedPatient)}
                  size="sm"
                  variant="destructive"
                >
                  Delete
                </Button>
                <Button onClick={clearSelection} size="sm" variant="outline">
                  Clear Selection
                </Button>
              </div>
            )}
          </div>

          {/* Add Patient Form */}
          {showAddForm && (
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Add New Patient</h4>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="add-name">Name *</Label>
                  <Input
                    id="add-name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Patient name"
                  />
                </div>
                <div>
                  <Label htmlFor="add-dob">Date of Birth</Label>
                  <Input
                    id="add-dob"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      handleInputChange("date_of_birth", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="add-sex">Sex Assigned at Birth</Label>
                  <select
                    id="add-sex"
                    value={formData.sex_assigned_at_birth}
                    onChange={(e) =>
                      handleInputChange("sex_assigned_at_birth", e.target.value)
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="add-weight">Weight (lbs)</Label>
                  <Input
                    id="add-weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) =>
                      handleInputChange("weight", e.target.value)
                    }
                    placeholder="Weight in pounds"
                  />
                </div>
                <div>
                  <Label htmlFor="add-complaint">Chief Complaint</Label>
                  <Input
                    id="add-complaint"
                    value={formData.chief_complaint}
                    onChange={(e) =>
                      handleInputChange("chief_complaint", e.target.value)
                    }
                    placeholder="Chief complaint"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddPatient} size="sm">
                  Add Patient
                </Button>
                <Button onClick={cancelForm} size="sm" variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Edit Patient Form */}
          {showEditForm && selectedPatient && (
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">
                Edit Patient: {selectedPatient.name}
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Patient name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-dob">Date of Birth</Label>
                  <Input
                    id="edit-dob"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      handleInputChange("date_of_birth", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-sex">Sex Assigned at Birth</Label>
                  <select
                    id="edit-sex"
                    value={formData.sex_assigned_at_birth}
                    onChange={(e) =>
                      handleInputChange("sex_assigned_at_birth", e.target.value)
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-weight">Weight (lbs)</Label>
                  <Input
                    id="edit-weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) =>
                      handleInputChange("weight", e.target.value)
                    }
                    placeholder="Weight in pounds"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-complaint">Chief Complaint</Label>
                  <Input
                    id="edit-complaint"
                    value={formData.chief_complaint}
                    onChange={(e) =>
                      handleInputChange("chief_complaint", e.target.value)
                    }
                    placeholder="Chief complaint"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleEditPatient} size="sm">
                  Save Changes
                </Button>
                <Button onClick={cancelForm} size="sm" variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Patient List */}
          {isLoading ? (
            <div className="text-center py-4">Loading patients...</div>
          ) : patients.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {searchTerm
                ? "No patients found matching your search."
                : "No patients found. Add your first patient above."}
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="font-medium">Patient List</h4>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPatient?.id === patient.id
                        ? "bg-blue-50 border-blue-200"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleSelectPatient(patient)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{patient.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {patient.date_of_birth &&
                            `DOB: ${formatDate(patient.date_of_birth)}`}
                          {patient.sex_assigned_at_birth &&
                            ` • ${patient.sex_assigned_at_birth}`}
                        </div>
                        {patient.chief_complaint && (
                          <div className="text-sm text-muted-foreground mt-1">
                            CC: {patient.chief_complaint}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Added {formatDate(patient.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Patient Details and Notes */}
          {selectedPatient && (
            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Selected Patient Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <strong>Name:</strong> {selectedPatient.name}
                  </div>
                  <div>
                    <strong>DOB:</strong>{" "}
                    {selectedPatient.date_of_birth
                      ? formatDate(selectedPatient.date_of_birth)
                      : "Not specified"}
                  </div>
                  <div>
                    <strong>Sex:</strong>{" "}
                    {selectedPatient.sex_assigned_at_birth || "Not specified"}
                  </div>
                  <div>
                    <strong>Weight:</strong>{" "}
                    {selectedPatient.weight
                      ? `${selectedPatient.weight} lbs`
                      : "Not specified"}
                  </div>
                </div>
                {selectedPatient.chief_complaint && (
                  <div className="mt-2 text-sm">
                    <strong>Chief Complaint:</strong>{" "}
                    {selectedPatient.chief_complaint}
                  </div>
                )}
              </div>

              {/* Patient Notes History */}
              {patientNotes.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">
                    Recent Notes ({patientNotes.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {patientNotes.slice(0, 5).map((note) => (
                      <div
                        key={note.id}
                        className="text-sm border-l-2 border-gray-200 pl-3"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{note.type}</span>
                          <span className="text-muted-foreground">
                            {formatDate(note.created_at)}
                          </span>
                        </div>
                        <div className="text-muted-foreground truncate">
                          {note.content.substring(0, 100)}...
                        </div>
                      </div>
                    ))}
                    {patientNotes.length > 5 && (
                      <div className="text-xs text-muted-foreground">
                        And {patientNotes.length - 5} more notes...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
