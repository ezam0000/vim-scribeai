import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNoteFormContext } from "../encounter-content/form";
import {
  MicIcon,
  SquareIcon,
  FileIcon,
  ClipboardIcon,
  CheckIcon,
  BugIcon,
} from "lucide-react";
import {
  EntitySectionTitle,
  EntitySectionContent,
  EntityFieldContent,
  EntityFieldTitle,
} from "../ui/entityContent";
import { Textarea } from "@/components/ui/textarea";
// import { Switch } from "@/components/ui/switch";
// import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SCRIBEAI_API_KEY, API_BASE_URL } from "@/config/env";

// WebSocket utilities for real-time transcription
const SCRIBEAI_WS_URL =
  "wss://api-scribeai-31058533dd54.herokuapp.com/api/live";

interface WebSocketTranscriptEvent {
  type:
    | "transcript"
    | "partial"
    | "final"
    | "error"
    | "connected"
    | "disconnected";
  text?: string;
  confidence?: number;
  error?: string;
  metadata?: {
    duration?: number;
    timestamp?: string;
    [key: string]: any;
  };
}

class ScribeAIWebSocket {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private eventHandlers: ((event: WebSocketTranscriptEvent) => void)[] = [];

  constructor() {
    if (!SCRIBEAI_API_KEY) {
      console.error("SCRIBEAI_API_KEY is required for WebSocket connection");
    }
  }

  onTranscriptEvent(handler: (event: WebSocketTranscriptEvent) => void) {
    this.eventHandlers.push(handler);
  }

  removeTranscriptEvent(handler: (event: WebSocketTranscriptEvent) => void) {
    this.eventHandlers = this.eventHandlers.filter((h) => h !== handler);
  }

  private emitEvent(event: WebSocketTranscriptEvent) {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error("Error in transcript event handler:", error);
      }
    });
  }

  async connect(): Promise<boolean> {
    if (this.isConnected) {
      console.log("WebSocket already connected");
      return true;
    }

    if (!SCRIBEAI_API_KEY) {
      this.emitEvent({
        type: "error",
        error:
          "ScribeAI API key not found. Please check your environment configuration.",
      });
      return false;
    }

    try {
      console.log("🔗 Connecting to ScribeAI WebSocket...");

      const wsUrlWithAuth = `${SCRIBEAI_WS_URL}?authorization=Bearer%20${encodeURIComponent(
        SCRIBEAI_API_KEY
      )}`;
      console.log("🔗 WebSocket URL:", wsUrlWithAuth);
      this.ws = new WebSocket(wsUrlWithAuth);

      return new Promise((resolve) => {
        if (!this.ws) {
          resolve(false);
          return;
        }

        this.ws.onopen = () => {
          console.log("✅ WebSocket connected successfully!");

          if (this.ws) {
            const config = {
              type: "config",
              noteType: "soap",
              customNotes: "",
            };
            console.log("📤 Sending configuration:", config);
            this.ws.send(JSON.stringify(config));
          }

          this.isConnected = true;
          this.emitEvent({ type: "connected" });
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            console.log("🔴 Raw WebSocket message received:", event.data);
            const data = JSON.parse(event.data);
            console.log("🔴 Parsed WebSocket data:", data);

            if (data.channel && data.channel.alternatives) {
              const transcript = data.channel.alternatives[0].transcript;
              if (transcript) {
                console.log("📝 Live transcript:", transcript);
                this.emitEvent({
                  type: "partial",
                  text: transcript,
                  confidence: data.channel.alternatives[0].confidence,
                });
              }
            } else if (data.type === "error") {
              console.log("❌ Received error from ScribeAI:", data);
              this.emitEvent({
                type: "error",
                error: data.error || data.message,
              });
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("❌ WebSocket error:", error);
          this.emitEvent({
            type: "error",
            error: "WebSocket connection failed",
          });
          resolve(false);
        };

        this.ws.onclose = (event) => {
          console.log("❌ WebSocket disconnected:", event.code, event.reason);
          this.isConnected = false;
          this.emitEvent({ type: "disconnected" });
        };
      });
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      this.emitEvent({
        type: "error",
        error: "Failed to establish WebSocket connection",
      });
      return false;
    }
  }

  async startStreaming(): Promise<boolean> {
    console.log("🎤 Starting live audio streaming...");

    // Connect to WebSocket first
    const connected = await this.connect();
    if (!connected) {
      console.error("❌ Failed to connect WebSocket");
      return false;
    }

    try {
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });

      // Create MediaRecorder for streaming (NOT for file creation)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      // Stream audio chunks directly to WebSocket
      mediaRecorder.ondataavailable = (event) => {
        if (
          event.data.size > 0 &&
          this.ws &&
          this.ws.readyState === WebSocket.OPEN
        ) {
          console.log("📡 Streaming audio chunk:", event.data.size, "bytes");
          this.ws.send(event.data);
        }
      };

      // Start streaming with frequent chunks for real-time
      mediaRecorder.start(100); // Send data every 100ms for maximum real-time

      // Store references for cleanup
      (this as any).currentStream = stream;
      (this as any).currentRecorder = mediaRecorder;

      console.log("✅ Live streaming started");
      return true;
    } catch (error) {
      console.error("❌ Failed to start streaming:", error);
      this.emitEvent({
        type: "error",
        error: "Failed to access microphone for streaming",
      });
      return false;
    }
  }

  stopStreaming() {
    console.log("🛑 Stopping live streaming...");

    // Stop the recorder
    if ((this as any).currentRecorder) {
      (this as any).currentRecorder.stop();
      (this as any).currentRecorder = null;
    }

    // Stop the stream
    if ((this as any).currentStream) {
      (this as any).currentStream
        .getTracks()
        .forEach((track: MediaStreamTrack) => track.stop());
      (this as any).currentStream = null;
    }

    console.log("✅ Live streaming stopped");
  }

  disconnect() {
    this.stopStreaming();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  getStatus() {
    return {
      connected: this.isConnected,
      streaming: !!(this as any).currentRecorder,
    };
  }
}

// Interface for parsed note sections
interface ParsedNote {
  subjective: {
    generalNotes?: string;
    chiefComplaint?: string;
    historyOfPresentIllness?: string;
    reviewOfSystems?: string;
  };
  objective: {
    generalNotes?: string;
    physicalExamNotes?: string;
  };
  assessment: {
    generalNotes?: string;
  };
  plan: {
    generalNotes?: string;
  };
  patientInstructions: {
    generalNotes?: string;
  };
}

export const ScribeAIIntegration = () => {
  const { toast } = useToast();
  const [transcript, setTranscript] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generatedNote, setGeneratedNote] = useState("");
  const [parsedNote, setParsedNote] = useState<ParsedNote | null>(null);
  const [customNotes, setCustomNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [autoApply, _setAutoApply] = useState(false);
  const [isNotePreviewOpen, setIsNotePreviewOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [debugMode, _setDebugMode] = useState(false);
  const [formFieldsInfo, setFormFieldsInfo] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WebSocket instance
  const webSocketRef = useRef<ScribeAIWebSocket | null>(null);

  // Initialize WebSocket
  useEffect(() => {
    webSocketRef.current = new ScribeAIWebSocket();

    const handleTranscriptEvent = (event: WebSocketTranscriptEvent) => {
      console.log("🔥 WebSocket Event Received:", event);

      switch (event.type) {
        case "connected":
          console.log("✅ WebSocket connected for real-time transcription");
          setProcessingStatus("🌐 Connected - ready for live transcription");
          toast({
            variant: "default",
            title: "WebSocket Connected",
            description: "Ready for live transcription",
          });
          break;

        case "disconnected":
          console.log("❌ WebSocket disconnected");
          setProcessingStatus("⚠️ WebSocket disconnected");
          break;

        case "error":
          console.error("❌ WebSocket error:", event.error);
          setProcessingStatus(`❌ WebSocket Error: ${event.error}`);
          toast({
            variant: "destructive",
            title: "WebSocket Error",
            description: event.error || "Connection failed",
          });
          break;

        case "partial":
          if (event.text) {
            console.log("📝 Live transcript received:", event.text);
            setTranscript((prev) => {
              // For real-time streaming, accumulate text naturally
              const newText = event.text!.trim();
              if (!newText) return prev;

              // If this is the first text or prev is empty, just use the new text
              if (!prev.trim()) {
                return newText;
              }

              // For continuous speech, add a space between segments
              return `${prev} ${newText}`;
            });
          }
          break;

        case "final":
          console.log("🏁 Final transcript received:", event.text);
          break;
      }
    };

    webSocketRef.current.onTranscriptEvent(handleTranscriptEvent);

    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.removeTranscriptEvent(handleTranscriptEvent);
        webSocketRef.current.disconnect();
      }
    };
  }, []);

  // Get form context to update the encounter form fields
  const { setValue, getValues, formState } = useNoteFormContext();

  // Effect to auto-apply note when generated if autoApply is enabled
  useEffect(() => {
    if (autoApply && parsedNote) {
      // Check if parsedNote has any content before attempting to apply
      const hasContent =
        (parsedNote.subjective.generalNotes &&
          parsedNote.subjective.generalNotes.trim() !== "") ||
        (parsedNote.subjective.chiefComplaint &&
          parsedNote.subjective.chiefComplaint.trim() !== "") ||
        (parsedNote.subjective.historyOfPresentIllness &&
          parsedNote.subjective.historyOfPresentIllness.trim() !== "") ||
        (parsedNote.subjective.reviewOfSystems &&
          parsedNote.subjective.reviewOfSystems.trim() !== "") ||
        (parsedNote.objective.generalNotes &&
          parsedNote.objective.generalNotes.trim() !== "") ||
        (parsedNote.objective.physicalExamNotes &&
          parsedNote.objective.physicalExamNotes.trim() !== "") ||
        (parsedNote.assessment.generalNotes &&
          parsedNote.assessment.generalNotes.trim() !== "") ||
        (parsedNote.plan.generalNotes &&
          parsedNote.plan.generalNotes.trim() !== "") ||
        (parsedNote.patientInstructions.generalNotes &&
          parsedNote.patientInstructions.generalNotes.trim() !== "");

      if (!hasContent) {
        console.warn("Auto-apply skipped: Note has no content");
        return;
      }

      // Add a small delay to ensure the form is ready
      const timer = setTimeout(() => {
        try {
          applyParsedNote();
        } catch (error) {
          console.error("Error in auto-apply:", error);
          // Show a toast notification for the error
          toast({
            variant: "destructive",
            title: "Auto-apply failed",
            description:
              "Failed to automatically apply the note to the form. Try applying manually.",
          });
        }
      }, 1000); // Increased delay to 1 second

      return () => clearTimeout(timer);
    }
  }, [parsedNote, autoApply]);

  // Debug function to check available form fields
  const checkFormFields = () => {
    try {
      const currentValues = getValues();
      const formInfo = {
        availableFields: Object.keys(currentValues),
        dirtyFields: Object.keys(formState.dirtyFields || {}),
        errors: formState.errors,
        isValid: formState.isValid,
      };

      setFormFieldsInfo(JSON.stringify(formInfo, null, 2));
      console.log("Form fields info:", formInfo);

      toast({
        variant: "default",
        title: "Form fields checked",
        description: `Found ${formInfo.availableFields.length} available fields`,
      });
    } catch (error) {
      console.error("Error checking form fields:", error);
      setFormFieldsInfo(JSON.stringify({ error: String(error) }, null, 2));

      toast({
        variant: "destructive",
        title: "Error checking form fields",
        description: String(error),
      });
    }
  };

  // Parse the generated note into sections
  const parseGeneratedNote = (note: string): ParsedNote => {
    // Initialize with empty sections
    const parsed: ParsedNote = {
      subjective: {},
      objective: {},
      assessment: {},
      plan: {},
      patientInstructions: {},
    };

    if (!note || typeof note !== "string") {
      console.error("Invalid note format:", note);
      return parsed;
    }

    // Normalize the note text to make parsing more reliable
    const normalizedNote = note
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (debugMode) {
      console.log("Normalized note for parsing:", normalizedNote);
    }

    // Extract major sections first
    const sections: Record<string, string> = {};

    // Match section headers and their content
    const majorSectionMatches = normalizedNote.match(
      /(?:^|\n)(SUBJECTIVE|OBJECTIVE|ASSESSMENT|PLAN|PATIENT INSTRUCTIONS):\s*([^]*?)(?=\n(?:SUBJECTIVE|OBJECTIVE|ASSESSMENT|PLAN|PATIENT INSTRUCTIONS):|\n*$)/gi
    );

    if (majorSectionMatches) {
      for (const match of majorSectionMatches) {
        const sectionMatch = match.match(
          /^(?:\n)?(SUBJECTIVE|OBJECTIVE|ASSESSMENT|PLAN|PATIENT INSTRUCTIONS):\s*([^]*?)$/is
        );
        if (sectionMatch) {
          const [, sectionName, content] = sectionMatch;
          sections[sectionName.toUpperCase()] = content.trim();
        }
      }
    }

    // Process SUBJECTIVE section
    if (sections.SUBJECTIVE) {
      parsed.subjective.generalNotes = sections.SUBJECTIVE;

      // Extract chief complaint
      const ccMatch = sections.SUBJECTIVE.match(
        /(?:^|\n)Chief\s+Complaint:?\s*([^]*?)(?=\n[A-Z][a-z]+:|\n\n|$)/i
      );
      if (ccMatch) {
        parsed.subjective.chiefComplaint = ccMatch[1].trim();
      }

      // Extract HPI
      const hpiMatch = sections.SUBJECTIVE.match(
        /(?:^|\n)(?:History\s+of\s+Present\s+Illness|HPI):?\s*([^]*?)(?=\n[A-Z][a-z]+:|\n\n|$)/i
      );
      if (hpiMatch) {
        parsed.subjective.historyOfPresentIllness = hpiMatch[1].trim();
      }

      // Extract ROS
      const rosMatch = sections.SUBJECTIVE.match(
        /(?:^|\n)(?:Review\s+of\s+Systems|ROS):?\s*([^]*?)(?=\n[A-Z][a-z]+:|\n\n|$)/i
      );
      if (rosMatch) {
        parsed.subjective.reviewOfSystems = rosMatch[1].trim();
      }
    } else {
      // If no SUBJECTIVE section found, use the whole note
      parsed.subjective.generalNotes = normalizedNote;
    }

    // Process OBJECTIVE section
    if (sections.OBJECTIVE) {
      parsed.objective.generalNotes = sections.OBJECTIVE;

      // Extract physical exam - note the VIM API uses physicalExamNotes
      const peMatch = sections.OBJECTIVE.match(
        /(?:^|\n)(?:Physical\s+Exam(?:ination)?|PE):?\s*([^]*?)(?=\n[A-Z][a-z]+:|\n\n|$)/i
      );
      if (peMatch) {
        parsed.objective.physicalExamNotes = peMatch[1].trim();
      }
    }

    // Process ASSESSMENT section
    if (sections.ASSESSMENT) {
      parsed.assessment.generalNotes = sections.ASSESSMENT;
    }

    // Process PLAN section
    if (sections.PLAN) {
      parsed.plan.generalNotes = sections.PLAN;
    }

    // Process PATIENT INSTRUCTIONS section
    if (sections["PATIENT INSTRUCTIONS"]) {
      parsed.patientInstructions.generalNotes =
        sections["PATIENT INSTRUCTIONS"];
    }

    // If we didn't find any sections, try a different approach
    if (
      !sections.SUBJECTIVE &&
      !sections.OBJECTIVE &&
      !sections.ASSESSMENT &&
      !sections.PLAN
    ) {
      // Look for common section indicators in unstructured text
      if (
        normalizedNote.match(
          /(?:chief\s+complaint|presenting\s+concern|reason\s+for\s+visit)/i
        )
      ) {
        parsed.subjective.chiefComplaint = normalizedNote;
      }

      // Default to putting the entire note in subjective general notes
      parsed.subjective.generalNotes = normalizedNote;
    }

    // Ensure we have at least something in each major section
    if (!parsed.subjective.generalNotes) {
      parsed.subjective.generalNotes = "No subjective information available.";
    }

    if (!parsed.objective.generalNotes) {
      parsed.objective.generalNotes = "No objective information available.";
    }

    if (!parsed.assessment.generalNotes) {
      parsed.assessment.generalNotes = "No assessment information available.";
    }

    if (!parsed.plan.generalNotes) {
      parsed.plan.generalNotes = "No plan information available.";
    }

    if (debugMode) {
      console.log("Parsed note:", parsed);
    }

    return parsed;
  };

  // Sanitize text to remove or replace non-English characters
  const sanitizeText = (text: string | undefined): string => {
    if (!text) return "";

    // Replace common special characters that might cause validation issues
    return (
      text
        // Replace smart quotes with regular quotes
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        // Replace em-dashes and en-dashes with regular hyphens
        .replace(/[\u2013\u2014]/g, "-")
        // Replace ellipsis with three periods
        .replace(/\u2026/g, "...")
        // Replace bullet points with asterisks
        .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, "*")
        // Replace degree symbol
        .replace(/\u00B0/g, " degrees")
        // Replace fractions
        .replace(/\u00BC/g, "1/4")
        .replace(/\u00BD/g, "1/2")
        .replace(/\u00BE/g, "3/4")
        // Replace other common medical symbols
        .replace(/\u00B1/g, "+/-") // Plus-minus sign
        .replace(/\u2264/g, "<=") // Less than or equal to
        .replace(/\u2265/g, ">=") // Greater than or equal to
        // Replace non-ASCII characters with empty string
        .replace(/[^\x00-\x7F]/g, "")
        // Replace multiple spaces with a single space
        .replace(/\s+/g, " ")
        .trim()
    );
  };

  // Check if text contains non-English characters
  const containsNonEnglishChars = (text: string | undefined): boolean => {
    if (!text) return false;
    return /[^\x00-\x7F]/.test(text);
  };

  // Generate VIM note using the ScribeAI API
  const generateNote = async () => {
    if (!transcript || transcript.trim() === "") {
      toast({
        variant: "destructive",
        title: "No transcript available",
        description:
          "Please record or upload audio first to generate a transcript.",
      });
      return;
    }

    // Check if transcript is too short
    if (transcript.trim().length < 10) {
      toast({
        variant: "destructive",
        title: "Transcript too short",
        description:
          "The transcript is too short to generate a meaningful note. Please record more audio.",
      });
      return;
    }

    try {
      const jwtToken = SCRIBEAI_API_KEY;

      // Use the VIM endpoint
      const endpoint = `${API_BASE_URL}/api/notes/vim`;

      // Try to get patient context from the form if available
      const currentValues = getValues();
      const existingChiefComplaint =
        currentValues.subjectiveChiefComplaint || "";

      // Based on the API expectations for VIM endpoint
      const payload = {
        transcriptText: transcript,
        patientInfo: {
          name: "", // These can be populated from VIM if available
          dob: "",
          chiefComplaint: existingChiefComplaint,
          visitDate: new Date().toISOString().split("T")[0],
          weight: null,
        },
        customNotes,
      };

      setProcessingStatus("Generating clinical note...");

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorDetail = await response.text();
        throw new Error(`Note generation failed: ${errorDetail}`);
      }

      const data = await response.json();

      if (debugMode) {
        console.log("VIM API Response:", data);
      }

      // Handle the VIM note structure
      if (data.structuredContent) {
        // Parse the structured content directly
        const structuredData = data.structuredContent;

        // Create a formatted text version for display
        let noteText = "SUBJECTIVE:\n";

        if (structuredData.subjective?.chiefComplaint) {
          noteText +=
            "Chief Complaint: " +
            structuredData.subjective.chiefComplaint +
            "\n\n";
        }

        if (structuredData.subjective?.historyOfPresentIllness) {
          noteText +=
            "History of Present Illness: " +
            structuredData.subjective.historyOfPresentIllness +
            "\n\n";
        }

        if (structuredData.subjective?.reviewOfSystems) {
          noteText +=
            "Review of Systems: " +
            structuredData.subjective.reviewOfSystems +
            "\n\n";
        }

        if (structuredData.subjective?.generalNotes) {
          noteText += structuredData.subjective.generalNotes + "\n\n";
        }

        noteText += "OBJECTIVE:\n";
        if (structuredData.objective?.physicalExamNotes) {
          noteText +=
            "Physical Examination: " +
            structuredData.objective.physicalExamNotes +
            "\n\n";
        }

        if (structuredData.objective?.generalNotes) {
          noteText += structuredData.objective.generalNotes + "\n\n";
        }

        noteText += "ASSESSMENT:\n";
        if (structuredData.assessment?.generalNotes) {
          noteText += structuredData.assessment.generalNotes + "\n\n";
        }

        noteText += "PLAN:\n";
        if (structuredData.plan?.generalNotes) {
          noteText += structuredData.plan.generalNotes + "\n\n";
        }

        if (structuredData.patientInstructions?.generalNotes) {
          noteText +=
            "PATIENT INSTRUCTIONS:\n" +
            structuredData.patientInstructions.generalNotes +
            "\n\n";
        }

        setGeneratedNote(noteText);

        // Create a parsed note object directly from the structured content
        const parsed: ParsedNote = {
          subjective: {
            generalNotes: sanitizeText(structuredData.subjective?.generalNotes),
            chiefComplaint: sanitizeText(
              structuredData.subjective?.chiefComplaint
            ),
            historyOfPresentIllness: sanitizeText(
              structuredData.subjective?.historyOfPresentIllness
            ),
            reviewOfSystems: sanitizeText(
              structuredData.subjective?.reviewOfSystems
            ),
          },
          objective: {
            generalNotes: sanitizeText(structuredData.objective?.generalNotes),
            physicalExamNotes: sanitizeText(
              structuredData.objective?.physicalExamNotes
            ),
          },
          assessment: {
            generalNotes: sanitizeText(structuredData.assessment?.generalNotes),
          },
          plan: {
            generalNotes: sanitizeText(structuredData.plan?.generalNotes),
          },
          patientInstructions: {
            generalNotes: sanitizeText(
              structuredData.patientInstructions?.generalNotes
            ),
          },
        };

        setParsedNote(parsed);
      } else {
        // Fallback to text parsing if structured content is not available
        let noteText = "";

        if (data.note) {
          noteText = data.note;
        } else if (data.generatedNote) {
          noteText = data.generatedNote;
        } else if (typeof data === "string") {
          noteText = data;
        } else {
          // If we can't parse the response, create a simple note with the transcript
          noteText =
            "SUBJECTIVE:\n" +
            transcript +
            "\n\n" +
            "OBJECTIVE:\nSee transcript for details.\n\n" +
            "ASSESSMENT:\nAssessment pending.\n\n" +
            "PLAN:\nPlan pending.";
        }

        setGeneratedNote(noteText);

        // Parse the note text to extract sections
        const parsed = parseGeneratedNote(noteText);
        setParsedNote(parsed);
      }

      toast({
        variant: "default",
        title: "Note generated successfully!",
        description: autoApply
          ? "Attempting to apply note to form..."
          : "Review and apply the note to the form.",
      });

      // Open note preview
      setIsNotePreviewOpen(true);
      setProcessingStatus(null);
    } catch (error: any) {
      console.error("Error generating note:", error);
      toast({
        variant: "destructive",
        title: "Error generating note",
        description: error.message,
      });
      setProcessingStatus(null);
    }
  };

  // Apply the parsed note to the encounter form
  const applyParsedNote = () => {
    if (!parsedNote) {
      toast({
        variant: "destructive",
        title: "No note to apply",
        description:
          "Please generate a note first before applying to the form.",
      });
      return;
    }

    try {
      // Get current values to merge with new values
      const currentValues = getValues();

      if (debugMode) {
        console.log("Current form values:", currentValues);
        console.log("Parsed note to apply:", parsedNote);

        // Check for non-English characters in each field
        const nonEnglishFields: string[] = [];
        if (containsNonEnglishChars(parsedNote.subjective.generalNotes))
          nonEnglishFields.push("Subjective General Notes");
        if (containsNonEnglishChars(parsedNote.subjective.chiefComplaint))
          nonEnglishFields.push("Chief Complaint");
        if (
          containsNonEnglishChars(parsedNote.subjective.historyOfPresentIllness)
        )
          nonEnglishFields.push("History of Present Illness");
        if (containsNonEnglishChars(parsedNote.subjective.reviewOfSystems))
          nonEnglishFields.push("Review of Systems");
        if (containsNonEnglishChars(parsedNote.objective.generalNotes))
          nonEnglishFields.push("Objective General Notes");
        if (containsNonEnglishChars(parsedNote.objective.physicalExamNotes))
          nonEnglishFields.push("Physical Exam Notes");
        if (containsNonEnglishChars(parsedNote.assessment.generalNotes))
          nonEnglishFields.push("Assessment");
        if (containsNonEnglishChars(parsedNote.plan.generalNotes))
          nonEnglishFields.push("Plan");
        if (
          containsNonEnglishChars(parsedNote.patientInstructions.generalNotes)
        )
          nonEnglishFields.push("Patient Instructions");

        if (nonEnglishFields.length > 0) {
          console.warn("Fields with non-English characters:", nonEnglishFields);
        }
      }

      // Validate that setValue is a function
      if (typeof setValue !== "function") {
        throw new Error(
          "setValue is not a function. Form context may not be properly initialized."
        );
      }

      // Check if any fields are available to update
      const availableFields = Object.keys(currentValues);
      if (availableFields.length === 0) {
        toast({
          variant: "destructive",
          title: "No form fields available",
          description: "The form has no available fields to update.",
        });
        return;
      }

      // Verify that we have at least one field with content to update
      const hasContent =
        (parsedNote.subjective.generalNotes &&
          parsedNote.subjective.generalNotes.trim() !== "") ||
        (parsedNote.subjective.chiefComplaint &&
          parsedNote.subjective.chiefComplaint.trim() !== "") ||
        (parsedNote.subjective.historyOfPresentIllness &&
          parsedNote.subjective.historyOfPresentIllness.trim() !== "") ||
        (parsedNote.subjective.reviewOfSystems &&
          parsedNote.subjective.reviewOfSystems.trim() !== "") ||
        (parsedNote.objective.generalNotes &&
          parsedNote.objective.generalNotes.trim() !== "") ||
        (parsedNote.objective.physicalExamNotes &&
          parsedNote.objective.physicalExamNotes.trim() !== "") ||
        (parsedNote.assessment.generalNotes &&
          parsedNote.assessment.generalNotes.trim() !== "") ||
        (parsedNote.plan.generalNotes &&
          parsedNote.plan.generalNotes.trim() !== "") ||
        (parsedNote.patientInstructions.generalNotes &&
          parsedNote.patientInstructions.generalNotes.trim() !== "");

      if (!hasContent) {
        toast({
          variant: "destructive",
          title: "Empty note",
          description:
            "The generated note doesn't contain any content to apply to the form.",
        });
        return;
      }

      // Define all field mappings between parsedNote and form fields
      const fieldMappings = [
        {
          field: "subjectiveGeneralNotes",
          content: sanitizeText(parsedNote.subjective.generalNotes),
          label: "Subjective General Notes",
        },
        {
          field: "subjectiveChiefComplaint",
          content: sanitizeText(parsedNote.subjective.chiefComplaint),
          label: "Chief Complaint",
        },
        {
          field: "subjectiveHistoryOfPresentIllness",
          content: sanitizeText(parsedNote.subjective.historyOfPresentIllness),
          label: "History of Present Illness",
        },
        {
          field: "subjectiveReviewOfSystems",
          content: sanitizeText(parsedNote.subjective.reviewOfSystems),
          label: "Review of Systems",
        },
        {
          field: "objectiveGeneralNotes",
          content: sanitizeText(parsedNote.objective.generalNotes),
          label: "Objective General Notes",
        },
        {
          field: "objectivePhysicalExamNotes",
          content: sanitizeText(parsedNote.objective.physicalExamNotes),
          label: "Physical Exam Notes",
        },
        {
          field: "assessmentGeneralNotes",
          content: sanitizeText(parsedNote.assessment.generalNotes),
          label: "Assessment",
        },
        {
          field: "planGeneralNotes",
          content: sanitizeText(parsedNote.plan.generalNotes),
          label: "Plan",
        },
        {
          field: "patientInstructionsGeneralNotes",
          content: sanitizeText(parsedNote.patientInstructions.generalNotes),
          label: "Patient Instructions",
        },
      ];

      // Track which fields were successfully updated
      const updatedFields: string[] = [];

      // Try to update all fields
      for (const mapping of fieldMappings) {
        if (mapping.field in currentValues && mapping.content) {
          try {
            // Update the field
            setValue(mapping.field as any, mapping.content, {
              shouldDirty: true,
              shouldValidate: true,
              shouldTouch: true,
            });

            // Add to list of updated fields
            updatedFields.push(mapping.label);
          } catch (error) {
            console.error(`Error updating ${mapping.label}:`, error);
            // Continue to next field
          }
        }
      }

      // Show success message with all updated fields
      if (updatedFields.length > 0) {
        toast({
          variant: "default",
          title: "Note applied to form successfully!",
          description: `Updated: ${updatedFields.join(", ")}`,
        });
      } else {
        // If we couldn't update any fields
        toast({
          variant: "default",
          title: "No fields updated",
          description:
            "Could not update any form fields. The note is still available in the preview.",
        });
      }
    } catch (error: any) {
      console.error("Error applying note to form:", error);

      // Enhanced error logging for validation errors
      if (error.message && error.message.includes("validation")) {
        console.error("Validation error details:", JSON.stringify(error));

        if (debugMode) {
          // Show more detailed error in toast for debugging
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: `Error details: ${JSON.stringify(error).substring(
              0,
              200
            )}...`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Validation Error",
            description:
              "The note contains characters or formatting that cannot be saved. Try editing the note manually.",
          });
        }
      }
      // Check for the specific validation error
      else if (
        error.message &&
        error.message.includes("No fields were specified in the update request")
      ) {
        toast({
          variant: "default",
          title: "Note available in preview",
          description:
            "The note couldn't be applied to the form but is available in the preview section.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error applying note to form",
          description: String(error),
        });
      }
    }
  };

  // Handle recording toggle
  const handleRecording = async () => {
    if (isRecording) {
      // Stop live streaming
      try {
        if (webSocketRef.current) {
          webSocketRef.current.stopStreaming();
        }
        setIsRecording(false);
        setProcessingStatus(null);
        toast({ variant: "default", title: "Live streaming stopped" });
        console.log("✅ Live streaming stopped");
      } catch (error) {
        console.error("❌ Error stopping streaming:", error);
        setIsRecording(false);
        setProcessingStatus(null);
      }
    } else {
      // Start live streaming ONLY - no file recording at all
      try {
        setTranscript(""); // Clear previous transcript

        if (!webSocketRef.current) {
          throw new Error("WebSocket not initialized");
        }

        console.log("🎯 Starting live streaming...");
        const success = await webSocketRef.current.startStreaming();
        console.log("🎯 Streaming start result:", success);

        if (success) {
          setIsRecording(true);
          setProcessingStatus("🎤 Live streaming - real-time transcription");
          toast({ variant: "default", title: "Live streaming started" });
          console.log("✅ Live streaming active");
        } else {
          throw new Error("Failed to start live streaming");
        }
      } catch (error) {
        console.error("❌ Failed to start live streaming:", error);
        toast({
          variant: "destructive",
          title: "Failed to start live streaming",
          description:
            error instanceof Error ? error.message : "Please try again",
        });
        setIsRecording(false);
        setProcessingStatus(null);
      }
    }
  };

  // Helper function to upload the audio file
  const uploadAudioFile = async (file: File) => {
    setUploading(true);
    try {
      const jwtToken = SCRIBEAI_API_KEY;

      const formData = new FormData();
      formData.append("audioFile", file);

      setProcessingStatus("Uploading and transcribing recording...");

      const response = await fetch(`${API_BASE_URL}/api/transcribe-file`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorDetail = await response.text();
        throw new Error(`File transcription failed: ${errorDetail}`);
      }

      const data = await response.json();

      // Extract the new transcript text
      let newTranscript = "";
      if (data.transcript) {
        newTranscript = data.transcript;
      } else if (data.transcriptText) {
        newTranscript = data.transcriptText;
      } else {
        console.warn("No transcript found in response:", data);
        newTranscript = "Transcription completed but no text was returned.";
      }

      // Append the new transcript to the existing one with proper formatting
      setTranscript((prevTranscript) => {
        if (!prevTranscript) return newTranscript;
        return `${prevTranscript}\n\n--- New Transcription ---\n${newTranscript}`;
      });

      toast({
        variant: "default",
        title: "Recording transcribed successfully!",
        description: "Click 'Generate Note' to create a clinical note.",
      });
      setProcessingStatus(null); // Clear the processing status

      // Remove automatic note generation
      // if (newTranscript) {
      //   await generateNote();
      // }
    } catch (error: any) {
      console.error("Transcription error:", error);
      toast({
        variant: "destructive",
        title: "Error transcribing recording",
        description: error.message,
      });
      setProcessingStatus(null);
    } finally {
      setUploading(false);
    }
  };

  // Handle audio file upload transcription
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessingStatus("Processing uploaded audio file...");
    await uploadAudioFile(file);
    // Reset the file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Copy generated note to clipboard
  const copyToClipboard = () => {
    if (generatedNote) {
      navigator.clipboard.writeText(generatedNote);
      toast({
        variant: "default",
        title: "Copied to clipboard",
        description: "The generated note has been copied to your clipboard.",
      });
    }
  };

  return (
    <div className="border rounded-md my-4 bg-gray-50 p-4">
      <EntitySectionTitle title="ScribeAI Note Generator" />
      <EntitySectionContent>
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            onClick={handleRecording}
            disabled={uploading}
            className="flex items-center"
          >
            {isRecording ? (
              <>
                <SquareIcon className="mr-2 h-4 w-4" />
                Stop Recording
              </>
            ) : (
              <>
                <MicIcon className="mr-2 h-4 w-4" />
                Start Recording
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={triggerFileUpload}
            disabled={uploading || isRecording}
            className="flex items-center"
          >
            <FileIcon className="mr-2 h-4 w-4" />
            Upload Audio
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex-grow"></div>

          {/* <div className="flex items-center space-x-2">
          <Switch
            id="auto-apply"
            checked={autoApply}
            onCheckedChange={setAutoApply}
          />
          <Label htmlFor="auto-apply">Auto-apply to form</Label>
        </div> */}

          {/* <div className="flex items-center space-x-2">
          <Switch
            id="debug-mode"
            checked={debugMode}
            onCheckedChange={setDebugMode}
          />
          <Label htmlFor="debug-mode">Debug Mode</Label>
        </div> */}

          {debugMode && (
            <Button
              variant="outline"
              onClick={checkFormFields}
              className="flex items-center"
            >
              <BugIcon className="mr-2 h-4 w-4" />
              Check Form Fields
            </Button>
          )}
        </div>

        {processingStatus && (
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
            {processingStatus}
          </div>
        )}

        {/* Debug info */}
        {debugMode && formFieldsInfo && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="text-xs font-bold mb-1">Form Fields Debug Info:</h4>
            <pre className="text-xs overflow-auto max-h-40">
              {formFieldsInfo}
            </pre>
          </div>
        )}

        {/* Transcript area */}
        <EntityFieldContent>
          <EntityFieldTitle title="Transcript" />
          <Textarea
            className="w-full min-h-[100px]"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Transcript will appear here or type directly..."
          />
        </EntityFieldContent>

        <EntityFieldContent>
          <EntityFieldTitle title="Additional Notes" />
          <Textarea
            className="w-full min-h-[60px]"
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder="Enter any additional notes or context..."
          />
        </EntityFieldContent>

        <div className="flex flex-wrap mb-4 md:space-x-2">
          <Button
            variant="default"
            disabled={!transcript || uploading || isRecording}
            onClick={generateNote}
            className="w-full mb-2 sm:flex-1"
          >
            Generate Note
          </Button>

          {parsedNote && (
            <Button
              variant="outline"
              onClick={applyParsedNote}
              className="flex-1 mb-2"
            >
              <CheckIcon className="mr-2 h-4 w-4" />
              Apply to Form
            </Button>
          )}

          {generatedNote && (
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="m-0 flex-1 "
            >
              <ClipboardIcon className="mr-2 h-4 w-4" />
              Copy Note
            </Button>
          )}
        </div>

        {generatedNote && (
          <Collapsible
            open={isNotePreviewOpen}
            onOpenChange={setIsNotePreviewOpen}
            className="mt-4 border rounded-md overflow-hidden"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full justify-between p-2"
              >
                <span>Note Preview</span>
                <span>{isNotePreviewOpen ? "▲" : "▼"}</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-3 bg-white">
                <pre className="whitespace-pre-wrap text-sm">
                  {generatedNote}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </EntitySectionContent>
    </div>
  );
};
