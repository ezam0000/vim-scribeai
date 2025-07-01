import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVimEncounters, VimEncounter } from "@/hooks/useVimEncounters";
import { useToast } from "@/hooks/use-toast";
import {
  HamburgerMenuIcon,
  Cross1Icon,
  ArrowLeftIcon,
} from "@radix-ui/react-icons";

export const EncounterSidebar: React.FC = () => {
  const {
    encounters,
    selectedEncounter,
    isLoading,
    searchTerm,
    selectEncounter,
    deleteEncounter,
    searchEncounters,
    getEncounterSummary,
    clearSelection,
  } = useVimEncounters();

  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "details">("list");
  const [searchInput, setSearchInput] = useState(searchTerm);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    searchEncounters(value);
  };

  // Handle encounter selection
  const handleSelectEncounter = async (encounter: VimEncounter) => {
    await selectEncounter(encounter);
    setViewMode("details");
  };

  // Handle deleting encounter
  const handleDeleteEncounter = async (encounter: VimEncounter) => {
    const summary = getEncounterSummary(encounter);
    if (
      window.confirm(
        `Are you sure you want to delete the encounter from "${summary.title}"? This action cannot be undone.`
      )
    ) {
      await deleteEncounter(encounter.id);
    }
  };

  // Handle back to list
  const handleBackToList = () => {
    setViewMode("list");
    clearSelection();
  };

  // Handle close modal
  const handleClose = () => {
    setIsOpen(false);
    setViewMode("list");
    clearSelection();
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Hamburger Menu Button - repositioned for small view */}
      <Button
        variant="outline"
        size="sm"
        className="fixed top-20 right-4 z-50 bg-white border-gray-300 shadow-md hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <HamburgerMenuIcon />
      </Button>

      {/* Full Screen Modal for small view */}
      {isOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            {viewMode === "details" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="flex items-center space-x-2"
              >
                <ArrowLeftIcon />
                <span>Back</span>
              </Button>
            ) : (
              <h2 className="text-lg font-semibold">
                VIM Encounters ({encounters.length})
              </h2>
            )}

            <Button variant="ghost" size="sm" onClick={handleClose}>
              <Cross1Icon />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {viewMode === "list" ? (
              /* Encounters List View */
              <div className="h-full flex flex-col">
                {/* Search */}
                <div className="p-4 border-b">
                  <Input
                    placeholder="Search encounters..."
                    value={searchInput}
                    onChange={handleSearch}
                    className="w-full"
                  />
                </div>

                {/* Encounters List */}
                <div className="flex-1 overflow-y-auto p-4">
                  {isLoading ? (
                    <div className="text-center py-8 text-gray-500">
                      Loading encounters...
                    </div>
                  ) : encounters.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm
                        ? "No encounters found matching your search."
                        : "No encounters found. Start recording to create your first encounter."}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {encounters.map((encounter) => {
                        const summary = getEncounterSummary(encounter);

                        return (
                          <div
                            key={encounter.id}
                            className="p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
                            onClick={() => handleSelectEncounter(encounter)}
                          >
                            <div className="space-y-2">
                              {/* Date and Time */}
                              <div className="flex justify-between items-center">
                                <div className="font-medium text-sm">
                                  {summary.date}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {summary.time}
                                </div>
                              </div>

                              {/* Transcript Preview */}
                              <div className="text-xs text-gray-600 line-clamp-3">
                                {summary.transcriptPreview}
                              </div>

                              {/* Status */}
                              <div className="flex justify-between items-center">
                                <span
                                  className={`
                                  text-xs px-2 py-1 rounded-full
                                  ${
                                    encounter.note_content
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }
                                `}
                                >
                                  {encounter.note_content
                                    ? "Has Note"
                                    : "No Note"}
                                </span>

                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEncounter(encounter);
                                  }}
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs px-2 py-1 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Encounter Details View */
              <div className="h-full flex flex-col">
                {selectedEncounter && (
                  <>
                    {/* Encounter Header */}
                    <div className="p-4 border-b bg-gray-50">
                      <h3 className="font-semibold">Encounter Details</h3>
                      <div className="text-sm text-gray-600 mt-1">
                        {formatDate(selectedEncounter.created_at)} at{" "}
                        {formatTime(selectedEncounter.created_at)}
                      </div>
                    </div>

                    {/* Encounter Content */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-6">
                      {/* Transcript Section */}
                      {selectedEncounter.transcript_content && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 text-gray-700">
                            Transcript
                          </h4>
                          <div className="bg-gray-50 p-3 rounded border text-sm whitespace-pre-wrap">
                            {selectedEncounter.transcript_content}
                          </div>
                        </div>
                      )}

                      {/* Note Section */}
                      {selectedEncounter.note_content && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 text-gray-700">
                            Generated Note
                          </h4>
                          <div className="bg-blue-50 p-3 rounded border text-sm whitespace-pre-wrap">
                            {selectedEncounter.note_content}
                          </div>
                        </div>
                      )}

                      {/* Patient Info Section */}
                      {selectedEncounter.patient_id && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 text-gray-700">
                            Patient Information
                          </h4>
                          <div className="bg-green-50 p-3 rounded border text-sm">
                            <div>
                              Patient ID: {selectedEncounter.patient_id}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-gray-700">
                          Metadata
                        </h4>
                        <div className="bg-gray-50 p-3 rounded border text-xs space-y-1">
                          <div>
                            <strong>Created:</strong>{" "}
                            {new Date(
                              selectedEncounter.created_at
                            ).toLocaleString()}
                          </div>
                          <div>
                            <strong>Updated:</strong>{" "}
                            {new Date(
                              selectedEncounter.updated_at
                            ).toLocaleString()}
                          </div>
                          <div>
                            <strong>ID:</strong> {selectedEncounter.id}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
