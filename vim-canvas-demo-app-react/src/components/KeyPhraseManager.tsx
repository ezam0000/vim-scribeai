import React, { useState } from "react";
import { useKeyPhrases, type KeyPhrase } from "@/hooks/useKeyPhrases";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
} from "lucide-react";

interface EditingKeyPhrase {
  id: string;
  keyPhrase: string;
  fullSentence: string;
}

export const KeyPhraseManager: React.FC = () => {
  const {
    keyPhrases,
    loading,
    error,
    addKeyPhrase,
    updateKeyPhrase,
    deleteKeyPhrase,
    clearError,
  } = useKeyPhrases();

  // Toggle functionality from client.js:665-676
  const [isExpanded, setIsExpanded] = useState(false);

  // Form state for adding new keyphrases
  const [newKeyPhrase, setNewKeyPhrase] = useState("");
  const [newFullText, setNewFullText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Edit state
  const [editingPhrase, setEditingPhrase] = useState<EditingKeyPhrase | null>(
    null
  );

  // Handle adding new keyphrase
  const handleAddKeyPhrase = async () => {
    if (!newKeyPhrase.trim() || !newFullText.trim()) {
      return;
    }

    setIsAdding(true);
    const success = await addKeyPhrase(newKeyPhrase, newFullText);

    if (success) {
      setNewKeyPhrase("");
      setNewFullText("");
    }

    setIsAdding(false);
  };

  // Handle editing keyphrase
  const handleEditKeyPhrase = (phrase: KeyPhrase) => {
    setEditingPhrase({
      id: phrase.id,
      keyPhrase: phrase.key_phrase,
      fullSentence: phrase.full_sentence,
    });
  };

  // Handle saving edited keyphrase
  const handleSaveEdit = async () => {
    if (!editingPhrase) return;

    const success = await updateKeyPhrase(
      editingPhrase.id,
      editingPhrase.keyPhrase,
      editingPhrase.fullSentence
    );

    if (success) {
      setEditingPhrase(null);
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingPhrase(null);
  };

  // Handle deleting keyphrase
  const handleDeleteKeyPhrase = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this keyphrase?")) {
      await deleteKeyPhrase(id);
    }
  };

  return (
    <div className="keyphrase-manager bg-white rounded-lg border p-4 space-y-4">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-2 h-auto"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="font-medium">Keyphrases</span>
              <span className="text-sm text-gray-500">
                ({keyPhrases.length})
              </span>
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4">
          {/* Error display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
              <span className="text-red-700 text-sm">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="h-auto p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Add new keyphrase form */}
          <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
            <h4 className="font-medium text-sm">Add New Keyphrase</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Trigger Phrase
                </label>
                <Input
                  placeholder="e.g., hpi"
                  value={newKeyPhrase}
                  onChange={(e) => setNewKeyPhrase(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Expansion Text
                </label>
                <Input
                  placeholder="e.g., History of Present Illness:"
                  value={newFullText}
                  onChange={(e) => setNewFullText(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
            <Button
              onClick={handleAddKeyPhrase}
              disabled={isAdding || !newKeyPhrase.trim() || !newFullText.trim()}
              size="sm"
              className="w-full md:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isAdding ? "Adding..." : "Add Keyphrase"}
            </Button>
          </div>

          {/* Keyphrases list */}
          <div className="space-y-2">
            {loading && keyPhrases.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Loading keyphrases...
              </div>
            ) : keyPhrases.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No keyphrases yet. Add your first one above!
              </div>
            ) : (
              keyPhrases.map((phrase) => (
                <div
                  key={phrase.id}
                  className="border rounded-lg p-3 bg-white space-y-2"
                >
                  {editingPhrase?.id === phrase.id ? (
                    // Edit mode
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Trigger Phrase
                          </label>
                          <Input
                            value={editingPhrase.keyPhrase}
                            onChange={(e) =>
                              setEditingPhrase({
                                ...editingPhrase,
                                keyPhrase: e.target.value,
                              })
                            }
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Expansion Text
                          </label>
                          <Input
                            value={editingPhrase.fullSentence}
                            onChange={(e) =>
                              setEditingPhrase({
                                ...editingPhrase,
                                fullSentence: e.target.value,
                              })
                            }
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveEdit}
                          size="sm"
                          disabled={loading}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          variant="outline"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                            {phrase.key_phrase}
                          </code>
                          <span className="text-gray-400">→</span>
                          <span className="text-sm text-gray-700">
                            {phrase.full_sentence}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleEditKeyPhrase(phrase)}
                          variant="ghost"
                          size="sm"
                          className="h-auto p-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteKeyPhrase(phrase.id)}
                          variant="ghost"
                          size="sm"
                          className="h-auto p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
