// ScribeAI WebSocket Live Transcription Utility
// Handles real-time audio streaming and transcript reception

const SCRIBEAI_WS_URL =
  "wss://api-scribeai-31058533dd54.herokuapp.com/api/live";
const SCRIBEAI_API_KEY = import.meta.env.VITE_SCRIBEAI_API_KEY as string;

export interface WebSocketTranscriptEvent {
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

export type TranscriptEventHandler = (event: WebSocketTranscriptEvent) => void;

export class ScribeAIWebSocket {
  private ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private isConnected = false;
  private isRecording = false;
  private eventHandlers: TranscriptEventHandler[] = [];
  private audioChunks: Blob[] = [];

  constructor() {
    if (!SCRIBEAI_API_KEY) {
      console.error("SCRIBEAI_API_KEY is required for WebSocket connection");
    }
  }

  // Add event listener for transcript updates
  onTranscriptEvent(handler: TranscriptEventHandler) {
    this.eventHandlers.push(handler);
  }

  // Remove event listener
  removeTranscriptEvent(handler: TranscriptEventHandler) {
    this.eventHandlers = this.eventHandlers.filter((h) => h !== handler);
  }

  // Emit events to all listeners
  private emitEvent(event: WebSocketTranscriptEvent) {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error("Error in transcript event handler:", error);
      }
    });
  }

  // Connect to ScribeAI WebSocket
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
      console.log("Connecting to ScribeAI WebSocket...");

      // Create WebSocket connection with JWT authentication
      const wsUrlWithAuth = `${SCRIBEAI_WS_URL}?authorization=Bearer%20${encodeURIComponent(
        SCRIBEAI_API_KEY
      )}`;
      console.log("🔗 Connecting to:", SCRIBEAI_WS_URL, "with auth");
      this.ws = new WebSocket(wsUrlWithAuth);
      this.ws.onopen = () => {
        console.log("✅ WebSocket connected successfully!");

        // Send configuration message (ScribeAI expects this format)
        if (this.ws) {
          const config = {
            type: "config",
            noteType: "soap", // soap, progress, diagnostic, psych
            customNotes: "",
          };
          console.log("📤 Sending configuration:", config);
          this.ws.send(JSON.stringify(config));
        }

        this.isConnected = true;
        this.emitEvent({ type: "connected" });
        console.log("🎯 WebSocket ready for audio streaming");
      };

      this.ws.onmessage = (event) => {
        try {
          console.log("🔴 Raw WebSocket message received:", event.data);
          const data = JSON.parse(event.data);
          console.log("🔴 Parsed WebSocket data:", data);

          // Handle ScribeAI message format based on their example
          if (data.type === "generatedNote") {
            // Final clinical note generated
            console.log("📋 Final note generated:", data.noteType, data.note);
            this.emitEvent({
              type: "final",
              text: JSON.stringify(data.note, null, 2),
              metadata: {
                noteType: data.noteType,
                note: data.note,
                timestamp: new Date().toISOString(),
              },
            });
          } else if (data.channel && data.channel.alternatives) {
            // Real-time transcript from Deepgram (ScribeAI format)
            const transcript = data.channel.alternatives[0].transcript;
            if (transcript) {
              console.log("📝 Live transcript:", transcript);
              this.emitEvent({
                type: "partial",
                text: transcript,
                confidence: data.channel.alternatives[0].confidence,
                metadata: {
                  timestamp: new Date().toISOString(),
                  channel: data.channel,
                },
              });
            }
          } else if (data.type === "error") {
            console.log("❌ Received error from ScribeAI:", data);
            this.emitEvent({
              type: "error",
              error: data.error || data.message,
            });
          } else {
            console.log("🤔 Unknown message format:", data);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
          this.emitEvent({
            type: "error",
            error: "Failed to parse transcript data",
          });
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.emitEvent({
          type: "error",
          error: "WebSocket connection error",
        });
      };

      this.ws.onclose = (event) => {
        console.log("❌ WebSocket disconnected:");
        console.log("  - Code:", event.code);
        console.log("  - Reason:", event.reason || "No reason provided");
        console.log("  - Was clean:", event.wasClean);

        // Common WebSocket close codes
        const closeReasons: { [key: number]: string } = {
          1000: "Normal closure",
          1001: "Going away",
          1002: "Protocol error",
          1003: "Unsupported data",
          1005: "No status received",
          1006: "Abnormal closure (usually network/auth issue)",
          1007: "Invalid frame payload data",
          1008: "Policy violation",
          1009: "Message too big",
          1010: "Extension handshake missing",
          1011: "Internal server error",
          1015: "TLS handshake failure",
        };

        console.log(
          "  - Meaning:",
          closeReasons[event.code] || "Unknown error code"
        );

        this.isConnected = false;
        this.emitEvent({ type: "disconnected" });

        // Clean up if recording
        if (this.isRecording) {
          this.stopRecording();
        }
      };

      return true;
    } catch (error) {
      console.error("Failed to connect to ScribeAI WebSocket:", error);
      this.emitEvent({
        type: "error",
        error: "Failed to establish WebSocket connection",
      });
      return false;
    }
  }

  // Start audio recording and streaming
  async startRecording(): Promise<boolean> {
    if (!this.isConnected) {
      await this.connect();
    }

    if (this.isRecording) {
      console.log("Already recording");
      return true;
    }

    try {
      // Get user media with audio constraints (match ScribeAI example)
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      console.log("🎤 Audio stream acquired:", {
        tracks: this.stream.getAudioTracks().map((track) => ({
          label: track.label,
          settings: track.getSettings(),
        })),
      });

      // Create MediaRecorder with formats commonly expected by transcription APIs
      const options: MediaRecorderOptions = {};

      // Try different audio formats that transcription APIs typically accept
      const formatPreferences = [
        "audio/wav",
        "audio/mp4;codecs=mp4a.40.2",
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
      ];

      for (const format of formatPreferences) {
        if (MediaRecorder.isTypeSupported(format)) {
          options.mimeType = format;
          console.log("🎵 Using audio format:", format);
          break;
        }
      }

      if (!options.mimeType) {
        console.log("⚠️ No preferred format supported, using default");
      }

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];

      console.log("🎵 MediaRecorder created with:", {
        mimeType: this.mediaRecorder.mimeType,
        options: options,
      });

      // Handle audio data - stream to WebSocket in real-time (ScribeAI format)
      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log("🎵 Sending audio chunk:", event.data.size, "bytes");

          // Convert blob to ArrayBuffer and send to WebSocket (ScribeAI expects this)
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
              const arrayBuffer = await event.data.arrayBuffer();
              this.ws.send(arrayBuffer);
              console.log("✅ Audio ArrayBuffer sent to WebSocket");
            } catch (err) {
              console.error("❌ Failed to send audio chunk:", err);
            }
          } else {
            console.log(
              "❌ WebSocket not ready, readyState:",
              this.ws?.readyState
            );
          }
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log("MediaRecorder stopped");

        // Create final audio blob for backup/fallback
        const finalBlob = new Blob(this.audioChunks, {
          type: this.mediaRecorder?.mimeType || "audio/webm",
        });

        // Store the blob for fallback access
        (this as any).lastRecordingBlob = finalBlob;

        // Emit final audio blob (could be used for file transcription fallback)
        this.emitEvent({
          type: "final",
          metadata: {
            audioBlob: finalBlob,
            duration: this.audioChunks.length * 100, // Approximate duration
            format: this.mediaRecorder?.mimeType,
          },
        });

        // Clean up
        this.stopRecording();
      };

      // Start recording with 250ms chunks (ScribeAI example uses 250ms)
      this.mediaRecorder.start(250);
      this.isRecording = true;

      console.log("🎙️ Started recording and streaming to ScribeAI WebSocket");
      console.log("📊 WebSocket status:", {
        connected: this.isConnected,
        readyState: this.ws?.readyState,
        url: SCRIBEAI_WS_URL,
      });

      // Monitor connection status during recording
      const connectionMonitor = setInterval(() => {
        if (this.ws) {
          console.log(
            "🔍 Connection check - ReadyState:",
            this.ws.readyState,
            "IsConnected:",
            this.isConnected
          );
          if (this.ws.readyState === WebSocket.CLOSED) {
            console.log("⚠️ WebSocket closed during recording!");
            clearInterval(connectionMonitor);
          }
        }
      }, 5000);

      return true;
    } catch (error) {
      console.error("Failed to start recording:", error);
      this.emitEvent({
        type: "error",
        error: "Failed to access microphone or start recording",
      });
      return false;
    }
  }

  // Stop recording and streaming
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.isRecording = false;
    console.log("Stopped recording");
  }

  // Disconnect WebSocket
  disconnect() {
    this.stopRecording();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
  }

  // Get connection status
  getStatus() {
    return {
      connected: this.isConnected,
      recording: this.isRecording,
      readyState: this.ws?.readyState,
      audioBlob: (this as any).lastRecordingBlob,
    };
  }

  // Clean up resources
  cleanup() {
    this.disconnect();
    this.eventHandlers = [];
  }
}

// Singleton instance for global use
let webSocketInstance: ScribeAIWebSocket | null = null;

export const getScribeAIWebSocket = (): ScribeAIWebSocket => {
  if (!webSocketInstance) {
    webSocketInstance = new ScribeAIWebSocket();
  }
  return webSocketInstance;
};

// React hook for easy WebSocket integration
export const useScribeAIWebSocket = () => {
  const ws = getScribeAIWebSocket();

  return {
    connect: () => ws.connect(),
    startRecording: () => ws.startRecording(),
    stopRecording: () => ws.stopRecording(),
    disconnect: () => ws.disconnect(),
    onTranscriptEvent: (handler: TranscriptEventHandler) =>
      ws.onTranscriptEvent(handler),
    removeTranscriptEvent: (handler: TranscriptEventHandler) =>
      ws.removeTranscriptEvent(handler),
    getStatus: () => ws.getStatus(),
    cleanup: () => ws.cleanup(),
  };
};

// ========================================
// Keyphrase Expansion Utilities
// ========================================

import type { KeyPhraseMappings } from "@/hooks/useKeyPhrases";

// Escape special regex characters - pattern from client.js:2448-2452
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Expand keyphrases in text - exact pattern from client.js real-time expansion logic
export const expandKeyPhrases = (
  text: string,
  keyPhraseMappings: KeyPhraseMappings
): string => {
  if (!text || Object.keys(keyPhraseMappings).length === 0) {
    console.log("🔍 No text or no keyphrases to expand:", {
      text,
      mappingsCount: Object.keys(keyPhraseMappings).length,
    });
    return text;
  }

  console.log("🔍 Expanding keyphrases in text:", { text, keyPhraseMappings });

  let processedText = text;

  // Process each keyphrase mapping - exact same logic as client.js
  for (const [keyPhrase, fullSentence] of Object.entries(keyPhraseMappings)) {
    const regex = new RegExp(`\\b${escapeRegExp(keyPhrase)}\\b`, "gi");
    const beforeExpansion = processedText;
    processedText = processedText.replace(regex, fullSentence);

    if (beforeExpansion !== processedText) {
      console.log("✅ Keyphrase expanded:", {
        keyPhrase,
        fullSentence,
        beforeExpansion,
        afterExpansion: processedText,
      });
    }
  }

  console.log("🔍 Final expansion result:", {
    originalText: text,
    expandedText: processedText,
  });
  return processedText;
};

// Enhanced transcript event handler with keyphrase expansion
export const createTranscriptEventHandlerWithExpansion = (
  keyPhraseMappings: KeyPhraseMappings,
  originalHandler: TranscriptEventHandler
): TranscriptEventHandler => {
  return (event: WebSocketTranscriptEvent) => {
    console.log("🎯 Enhanced handler called with event:", {
      type: event.type,
      text: event.text,
      mappingsCount: Object.keys(keyPhraseMappings).length,
    });

    // Only expand text for transcript events that have text content
    if (
      event.text &&
      (event.type === "transcript" || event.type === "partial")
    ) {
      console.log("🎯 Processing text event for keyphrase expansion");
      const expandedText = expandKeyPhrases(event.text, keyPhraseMappings);

      // Create new event with expanded text
      const expandedEvent: WebSocketTranscriptEvent = {
        ...event,
        text: expandedText,
        metadata: {
          ...event.metadata,
          originalText: event.text, // Keep original for reference
          keyPhrasesExpanded: expandedText !== event.text,
        },
      };

      console.log("🎯 Calling original handler with expanded event:", {
        originalText: event.text,
        expandedText,
      });
      // Call the original handler with expanded text
      originalHandler(expandedEvent);
    } else {
      console.log("🎯 Passing through non-text event unchanged");
      // Pass through non-text events unchanged
      originalHandler(event);
    }
  };
};
