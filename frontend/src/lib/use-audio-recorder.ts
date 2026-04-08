"use client";

import { useEffect, useRef, useState } from "react";

const mediaRecorderOptions = [
  { mimeType: "audio/webm;codecs=opus", extension: "webm" },
  { mimeType: "audio/webm", extension: "webm" },
  { mimeType: "audio/ogg;codecs=opus", extension: "ogg" },
  { mimeType: "audio/mp4", extension: "m4a" },
] as const;

export function useAudioRecorder(filenamePrefix: string) {
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isRecorderSupported, setIsRecorderSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioPreviewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setIsRecorderSupported(
      typeof window !== "undefined" &&
        typeof MediaRecorder !== "undefined" &&
        typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia,
    );

    return () => {
      cleanup();
    };
  }, []);

  async function startRecording() {
    if (!isRecorderSupported) {
      throw new Error("This browser does not support audio recording.");
    }

    clearRecording();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const preferredFormat = resolvePreferredRecordingFormat();
    const recorder = preferredFormat.mimeType
      ? new MediaRecorder(stream, { mimeType: preferredFormat.mimeType })
      : new MediaRecorder(stream);

    mediaStreamRef.current = stream;
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blobType = recorder.mimeType || preferredFormat.mimeType || "audio/webm";
      const recordingBlob = new Blob(chunksRef.current, { type: blobType });
      const extension = preferredFormat.extension ?? "webm";
      const file = new File([recordingBlob], `${filenamePrefix}-${Date.now()}.${extension}`, {
        type: blobType,
      });
      const nextPreviewUrl = URL.createObjectURL(file);

      if (audioPreviewUrlRef.current) {
        URL.revokeObjectURL(audioPreviewUrlRef.current);
      }

      audioPreviewUrlRef.current = nextPreviewUrl;
      setAudioPreviewUrl(nextPreviewUrl);
      setRecordedFile(file);
      stopStream();
      mediaRecorderRef.current = null;
      chunksRef.current = [];
      setIsRecording(false);
    };

    recorder.start();
    setIsRecording(true);
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return;
    }

    recorder.stop();
  }

  function clearRecording() {
    setRecordedFile(null);

    if (audioPreviewUrlRef.current) {
      URL.revokeObjectURL(audioPreviewUrlRef.current);
      audioPreviewUrlRef.current = null;
    }

    setAudioPreviewUrl(null);
  }

  function setSelectedFile(file: File | null) {
    clearRecording();

    if (!file) {
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    audioPreviewUrlRef.current = nextPreviewUrl;
    setAudioPreviewUrl(nextPreviewUrl);
    setRecordedFile(file);
    setIsRecording(false);
  }

  function cleanup() {
    stopStream();
    if (audioPreviewUrlRef.current) {
      URL.revokeObjectURL(audioPreviewUrlRef.current);
    }
  }

  function stopStream() {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }

  return {
    audioPreviewUrl,
    clearRecording,
    isRecorderSupported,
    isRecording,
    recordedFile,
    setSelectedFile,
    startRecording,
    stopRecording,
  };
}

function resolvePreferredRecordingFormat(): { mimeType: string; extension: string } {
  if (typeof MediaRecorder === "undefined") {
    return { mimeType: "", extension: "webm" };
  }

  const supported = mediaRecorderOptions.find((option) =>
    MediaRecorder.isTypeSupported(option.mimeType),
  );

  return supported ?? { mimeType: "", extension: "webm" };
}
