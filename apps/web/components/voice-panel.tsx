"use client";
import { useRef, useState, useEffect } from "react";
import { Mic, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LocalOpsClient } from "@/lib/api";
export function VoicePanel({
  client,
  onSend,
  lastAnswer,
  onError,
}: {
  client: LocalOpsClient;
  onSend: (q: string) => void;
  lastAnswer: string;
  onError: (e: unknown) => void;
}) {
  const [recording, setRecording] = useState(false),
    [busy, setBusy] = useState(false),
    [transcript, setTranscript] = useState(""),
    [speaking, setSpeaking] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null),
    media = useRef<MediaStream | null>(null),
    audio = useRef<HTMLAudioElement | null>(null),
    objectUrl = useRef("");
  useEffect(
    () => () => {
      recorder.current?.stop();
      media.current?.getTracks().forEach((t) => t.stop());
      audio.current?.pause();
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );
  async function start() {
    try {
      if (!navigator.mediaDevices || typeof MediaRecorder === "undefined")
        throw new Error(
          "Recording needs a compatible browser and a secure local origin.",
        );
      media.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const rec = new MediaRecorder(media.current);
      recorder.current = rec;
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = async () => {
        media.current?.getTracks().forEach((t) => t.stop());
        setRecording(false);
        setBusy(true);
        try {
          setTranscript(
            (await client.transcribe(new Blob(chunks, { type: rec.mimeType })))
              .text,
          );
        } catch (e) {
          onError(e);
        } finally {
          setBusy(false);
        }
      };
      rec.start();
      setRecording(true);
      setTimeout(() => {
        if (rec.state === "recording") rec.stop();
      }, 110000);
    } catch (e) {
      onError(e);
    }
  }
  async function speak() {
    setBusy(true);
    try {
      const blob = await client.synthesize(lastAnswer);
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(blob);
      audio.current = new Audio(objectUrl.current);
      audio.current.onended = () => setSpeaking(false);
      await audio.current.play();
      setSpeaking(true);
    } catch (e) {
      onError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="content-card voice-panel">
      <div className="assistant-icon">
        <Mic />
      </div>
      <h2>Speak to your local assistant</h2>
      <p>
        Recording is transcribed by Faster-Whisper on your computer. Review the
        transcript before sending it to the same operations agent.
      </p>
      {!client.local && (
        <div className="notice">
          Voice requires the local application and downloaded speech models.
          Browser speech services are not used.
        </div>
      )}
      <div className="button-row">
        <Button
          disabled={!client.local || busy}
          onClick={() => (recording ? recorder.current?.stop() : start())}
        >
          {recording ? <Square /> : <Mic />}
          {recording ? "Stop recording" : "Start recording"}
        </Button>
        <span role="status">
          {recording
            ? "Recording · maximum 110 seconds"
            : busy
              ? "Processing locally…"
              : ""}
        </span>
      </div>
      <label htmlFor="transcript">Review transcript</label>
      <textarea
        id="transcript"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Your transcript will appear here. You can also type a message."
      />
      <Button
        disabled={!transcript.trim() || busy}
        onClick={() => onSend(transcript)}
      >
        Send transcript
      </Button>
      <div className="button-row">
        <Button
          variant="outline"
          disabled={!client.local || !lastAnswer || busy}
          onClick={speak}
        >
          <Volume2 />
          Read last answer
        </Button>
        {speaking && (
          <Button
            variant="outline"
            onClick={() => {
              audio.current?.pause();
              setSpeaking(false);
            }}
          >
            Stop audio
          </Button>
        )}
      </div>
    </section>
  );
}
