"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult:
    | ((e: {
        results: { isFinal: boolean; 0: { transcript: string } }[];
        resultIndex: number;
      }) => void)
    | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
export function VoiceControls({
  onTranscript,
  lastAnswer,
  onError,
  disabled = false,
}: {
  onTranscript: (text: string) => void;
  lastAnswer: string;
  onError: (e: unknown) => void;
  disabled?: boolean;
}) {
  const [listening, setListening] = useState(false),
    [speaking, setSpeaking] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  useEffect(
    () => () => {
      recognition.current?.abort();
      window.speechSynthesis?.cancel();
    },
    [],
  );
  function listen() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Constructor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Constructor) {
      onError(
        new Error(
          "Voice input is not supported in this browser. Open this site in Chrome or Edge, or type your message.",
        ),
      );
      return;
    }
    const rec = new Constructor();
    recognition.current = rec;
    rec.lang = navigator.language || "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .filter((r) => r.isFinal)
        .map((r) => r[0].transcript)
        .join(" ");
      if (text.trim()) onTranscript(text.trim());
    };
    rec.onerror = (e) => {
      setListening(false);
      if (e.error !== "aborted")
        onError(
          new Error(
            e.error === "not-allowed"
              ? "Microphone access was denied. Allow microphone access for this site, then try again."
              : e.error === "no-speech"
                ? "No speech detected. Please try again."
                : "Voice input could not connect. Check your microphone and internet connection, then retry.",
          ),
        );
    };
    rec.onend = () => setListening(false);
    try {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      rec.start();
      setListening(true);
    } catch (e) {
      setListening(false);
      onError(e);
    }
  }
  function speak() {
    if (!window.speechSynthesis) {
      onError(new Error("Read aloud is unavailable in this browser."));
      return;
    }
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const speech = new SpeechSynthesisUtterance(lastAnswer.slice(0, 6000));
    speech.onend = () => setSpeaking(false);
    speech.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(speech);
  }
  return (
    <div className="voice-controls">
      {listening && (
        <span role="status" className="listening-label">
          Listening…
        </span>
      )}
      {lastAnswer && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={speaking ? "Stop reading" : "Read answer aloud"}
          onClick={speak}
        >
          {speaking ? <Square size={18} /> : <Volume2 size={20} />}
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        aria-label={listening ? "Stop listening" : "Use microphone"}
        title="Dictate a message (uses your browser's speech service)"
        className={listening ? "mic-active" : ""}
        onClick={listen}
      >
        {listening ? <Square size={19} /> : <Mic size={21} />}
      </Button>
    </div>
  );
}
