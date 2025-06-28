import React, { useState } from "react";
import { useVimEncounters, VimEncounter } from "@/hooks/useVimEncounters";
import { useAppSize } from "@/hooks/useAppSize";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { FileText, User, Calendar, Clock } from "lucide-react";

export const VimEncountersView: React.FC = () => {
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

  const { currentSize, isMobile } = useAppSize();
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

  // For mobile view, show full screen encounters list or notes
  if (isMobile || currentSize === "CLASSIC") {
    return (
      <div className="h-full">
        {selectedEncounter ? (
          // Mobile: Show encounter details
          <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <button
                onClick={clearSelection}
                className="text-blue-600 hover:text-blue-800 mb-2"
              >
                ← Back to Encounters
              </button>
              <h2 className="text-lg font-semibold">Encounter Details</h2>
              <p className="text-sm text-gray-600">
                {new Date(selectedEncounter.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {/* Transcript */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Transcript</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedEncounter.transcript_content ||
                        "No transcript available"}
                    </p>
                  </CardContent>
                </Card>

                {/* Generated Note */}
                {selectedEncounter.note_content && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Generated Note</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">
                        {selectedEncounter.note_content}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Mobile: Show encounters list
          <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold mb-4">
                VIM Encounters ({encounters.length})
              </h2>

              {/* Search */}
              <Input
                placeholder="Search encounters..."
                value={searchInput}
                onChange={handleSearch}
                className="w-full"
              />
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
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
                      <Card
                        key={encounter.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleSelectEncounter(encounter)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-2 text-sm font-medium">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>{summary.date}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{summary.time}</span>
                            </div>
                          </div>

                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {summary.transcriptPreview}
                          </p>

                          <div className="flex justify-between items-center">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                summary.hasNote
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {summary.hasNote ? "Note Generated" : "No Note"}
                            </span>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-red-600 hover:text-red-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEncounter(encounter);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop view: Left-right layout
  return (
    <div className="h-full flex">
      {/* Left Column: Encounters List */}
      <div
        className={`border-r bg-gray-50 overflow-y-auto ${
          currentSize === "LARGE" ? "w-1/2" : "w-1/3"
        }`}
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">
            VIM Encounters ({encounters.length})
          </h2>

          {/* Search */}
          <Input
            placeholder="Search encounters..."
            value={searchInput}
            onChange={handleSearch}
            className="w-full mb-4"
          />

          {/* Selected Encounter Info */}
          {selectedEncounter && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-sm">Selected</div>
                  <div className="text-xs text-gray-600">
                    {new Date(
                      selectedEncounter.created_at
                    ).toLocaleDateString()}
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

          {/* Encounters List */}
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
                        <span
                          className={`
                          text-xs px-2 py-1 rounded-full
                          ${
                            summary.hasNote
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }
                        `}
                        >
                          {summary.hasNote ? "Note Generated" : "No Note"}
                        </span>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-600 hover:text-red-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEncounter(encounter);
                          }}
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

      {/* Right Side: Encounter Details */}
      <div className="flex-1 flex flex-col">
        {selectedEncounter ? (
          <>
            {/* Encounter Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center space-x-3">
                <User className="h-6 w-6 text-gray-400" />
                <div>
                  <h2 className="text-lg font-semibold">Encounter Details</h2>
                  <div className="flex space-x-4 text-sm text-gray-600">
                    <span>
                      Date:{" "}
                      {new Date(
                        selectedEncounter.created_at
                      ).toLocaleDateString()}
                    </span>
                    <span>
                      Time:{" "}
                      {new Date(
                        selectedEncounter.created_at
                      ).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Encounter Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {/* Transcript */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span>Transcript</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedEncounter.transcript_content ||
                        "No transcript available"}
                    </p>
                  </CardContent>
                </Card>

                {/* Generated Note */}
                {selectedEncounter.note_content && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span>Generated Note</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedEncounter.note_content}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {!selectedEncounter.note_content && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No generated note available for this encounter</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          // No encounter selected
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select an encounter to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
