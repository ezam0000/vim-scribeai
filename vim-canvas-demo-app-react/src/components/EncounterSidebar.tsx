import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVimEncounters, VimEncounter } from "@/hooks/useVimEncounters";
import { useToast } from "@/hooks/use-toast";
import { HamburgerMenuIcon, Cross1Icon } from "@radix-ui/react-icons";

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
  const [searchInput, setSearchInput] = useState(searchTerm);
  const { toast } = useToast();

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    searchEncounters(value);
  };

  // Handle encounter selection
  const handleSelectEncounter = async (encounter: VimEncounter) => {
    await selectEncounter(encounter);
    // Auto-close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
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
      {/* Hamburger Menu Button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed top-[150px] left-1 z-50 bg-white border-gray-300 shadow-md hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <Cross1Icon /> : <HamburgerMenuIcon />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-[155px] left-0 h-[calc(100vh-155px)] ${
          selectedEncounter ? "w-[1000px]" : "w-80"
        } bg-white border-r border-gray-200 shadow-lg z-40 
        transform transition-all duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        overflow-hidden
      `}
      >
        <div
          className={`flex h-full ${
            selectedEncounter ? "divide-x divide-gray-200" : ""
          }`}
        >
          {/* Left Panel - Encounter List */}
          <div
            className={`${
              selectedEncounter ? "w-80" : "w-full"
            } p-4 overflow-y-auto`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pt-4">
              <h2 className="text-lg font-semibold">VIM Encounters</h2>
              <span className="text-sm text-gray-500">
                ({encounters.length})
              </span>
            </div>

            {/* Search */}
            <div className="mb-4">
              <Input
                placeholder="Search encounters..."
                value={searchInput}
                onChange={handleSearch}
                className="w-full"
              />
            </div>

            {/* Selected Encounter Info */}
            {selectedEncounter && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">Selected</div>
                    <div className="text-xs text-gray-600">
                      {formatDate(selectedEncounter.created_at)}
                    </div>
                  </div>
                  <Button
                    onClick={clearSelection}
                    size="sm"
                    variant="outline"
                    className="text-xs px-2 py-1 h-auto"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* Encounter List */}
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
              <div className="space-y-2">
                {encounters.map((encounter) => {
                  const summary = getEncounterSummary(encounter);
                  const isSelected = selectedEncounter?.id === encounter.id;

                  return (
                    <div
                      key={encounter.id}
                      className={`
                      p-3 rounded-lg border cursor-pointer transition-colors
                      ${
                        isSelected
                          ? "bg-blue-50 border-blue-200 ring-1 ring-blue-300"
                          : "hover:bg-gray-50 border-gray-200"
                      }
                    `}
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
                        <div className="text-xs text-gray-600 line-clamp-2">
                          {summary.transcriptPreview}
                        </div>

                        {/* Status and Actions */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            {/* Note Status */}
                            <span
                              className={`
                            text-xs px-2 py-1 rounded-full
                            ${
                              summary.hasNote
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }
                          `}
                            >
                              {summary.hasNote ? "Note Generated" : "No Note"}
                            </span>
                          </div>

                          {/* Delete Button */}
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

          {/* Right Panel - Selected Encounter Details */}
          {selectedEncounter && (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Encounter Details</h3>
                  <div className="text-xs text-gray-500">
                    {formatDate(selectedEncounter.created_at)} at{" "}
                    {formatTime(selectedEncounter.created_at)}
                  </div>
                </div>

                {/* Transcript Content */}
                {selectedEncounter.transcript_content && (
                  <div className="mb-6">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Transcript:
                    </div>
                    <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border max-h-60 overflow-y-auto whitespace-pre-wrap">
                      {selectedEncounter.transcript_content}
                    </div>
                  </div>
                )}

                {/* Note Content */}
                {selectedEncounter.note_content && (
                  <div className="mb-6">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Generated Note:
                    </div>
                    <div className="text-sm text-gray-700 bg-green-50 p-4 rounded-lg border border-green-200 max-h-60 overflow-y-auto whitespace-pre-wrap">
                      {selectedEncounter.note_content}
                    </div>
                  </div>
                )}

                {/* Patient/Encounter IDs if available */}
                {(selectedEncounter.patient_id ||
                  selectedEncounter.encounter_id) && (
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border space-y-1">
                    <div className="font-medium text-gray-700 mb-2">
                      Metadata:
                    </div>
                    {selectedEncounter.patient_id && (
                      <div>Patient ID: {selectedEncounter.patient_id}</div>
                    )}
                    {selectedEncounter.encounter_id && (
                      <div>Encounter ID: {selectedEncounter.encounter_id}</div>
                    )}
                  </div>
                )}

                {/* No content message */}
                {!selectedEncounter.transcript_content &&
                  !selectedEncounter.note_content && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-sm">
                        No content available for this encounter.
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
