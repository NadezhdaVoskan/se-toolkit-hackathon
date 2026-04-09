"use client";

import { useEffect, useState } from "react";
import { AudioRecorderCard } from "@/components/audio-recorder-card";
import { TranscriptionCard } from "@/components/transcription-card";
import { WeeklyTaskBoard } from "@/components/weekly-task-board";
import { fetchTasks, updateTask, uploadAudioNote } from "@/lib/api";
import { useAudioRecorder } from "@/lib/use-audio-recorder";
import type { Task } from "@/types/task";
import type { WorkflowPhase } from "@/types/workflow";

export function PlannerClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [detectedTasks, setDetectedTasks] = useState<Task[]>([]);
  const [transcriptionText, setTranscriptionText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notePhase, setNotePhase] = useState<WorkflowPhase>("idle");
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const noteRecorder = useAudioRecorder("voice-note");

  useEffect(() => {
    void refreshTasks("Could not load existing tasks.").catch((loadError) => {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load existing tasks.",
      );
    });
  }, []);

  async function refreshTasks(errorMessage = "Could not refresh tasks.") {
    try {
      const nextTasks = await fetchTasks();
      setTasks(nextTasks);
    } catch (loadError) {
      throw new Error(loadError instanceof Error ? loadError.message : errorMessage);
    }
  }

  async function startNoteRecording() {
    setError(null);
    setTranscriptionText("");
    setDetectedTasks([]);
    setNotePhase("recording");

    try {
      await noteRecorder.startRecording();
    } catch (recordError) {
      setNotePhase("idle");
      setError(
        recordError instanceof Error
          ? recordError.message
          : "Could not start recording. Please allow microphone access.",
      );
    }
  }

  async function uploadTaskAudio() {
    if (!noteRecorder.recordedFile) {
      setError("Record a voice note before uploading.");
      return;
    }

    setError(null);
    setNotePhase("uploading");
    const clearPhaseTimers = startProcessingPhaseTimers(setNotePhase);

    try {
      const uploadResult = await uploadAudioNote(noteRecorder.recordedFile);
      setTranscriptionText(uploadResult.transcription_text);
      setDetectedTasks(uploadResult.extracted_tasks);
      await refreshTasks("Could not refresh tasks after upload.");
      noteRecorder.clearRecording();
      setNotePhase("done");
    } catch (uploadError) {
      setNotePhase("idle");
      setError(
        uploadError instanceof Error ? uploadError.message : "Could not upload the recording.",
      );
    } finally {
      clearPhaseTimers();
    }
  }

  async function toggleTaskStatus(task: Task) {
    const nextStatus = task.status === "done" ? "todo" : "done";
    setUpdatingTaskId(task.id);
    setError(null);

    try {
      await updateTask(task.id, { status: nextStatus });
      await refreshTasks("Could not refresh tasks after updating status.");
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Could not update the task.",
      );
    } finally {
      setUpdatingTaskId(null);
    }
  }

  useEffect(() => {
    if (!noteRecorder.isRecording && notePhase === "recording") {
      setNotePhase(noteRecorder.recordedFile ? "idle" : "recording");
    }
  }, [notePhase, noteRecorder.isRecording, noteRecorder.recordedFile]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      <section className="rounded-[32px] border border-white/80 bg-[linear-gradient(140deg,rgba(255,255,255,0.96),rgba(242,248,246,0.9))] px-6 py-8 shadow-[0_28px_90px_-38px_rgba(15,23,42,0.35)] md:px-8 md:py-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-emerald-700">
              Voice Weekly Planner
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              Turn one spoken planning note into a weekly task board.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              Record or upload a planning note, let the app transcribe it, and review the
              extracted tasks in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-auto">
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tasks</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{tasks.length}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Recorder</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Voice Notes Only</p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AudioRecorderCard
          audioPreviewUrl={noteRecorder.audioPreviewUrl}
          canUpload={Boolean(noteRecorder.recordedFile)}
          description="Record a spoken note, then upload it for transcription and task extraction."
          fileInputId="voice-note-file-input"
          isProcessing={
            notePhase === "uploading" ||
            notePhase === "transcribing" ||
            notePhase === "extracting"
          }
          isRecorderSupported={noteRecorder.isRecorderSupported}
          isRecording={noteRecorder.isRecording}
          phase={notePhase}
          previewEmptyText="A preview player will appear here after you stop recording."
          previewTitle="Planning note preview"
          title="Voice Note Recorder"
          uploadLabel="Upload Voice Note"
          onFileSelected={noteRecorder.setSelectedFile}
          onStartRecording={startNoteRecording}
          onStopRecording={noteRecorder.stopRecording}
          onUpload={uploadTaskAudio}
        />
        <TranscriptionCard
          detectedTasks={detectedTasks}
          transcriptionText={transcriptionText}
        />
      </div>

      <WeeklyTaskBoard
        tasks={tasks}
        updatingTaskId={updatingTaskId}
        onToggleTaskStatus={toggleTaskStatus}
      />
    </main>
  );
}

function startProcessingPhaseTimers(
  setPhase: (phase: WorkflowPhase | ((current: WorkflowPhase) => WorkflowPhase)) => void,
) {
  const timers = [
    window.setTimeout(() => {
      setPhase((currentPhase) => (currentPhase === "uploading" ? "transcribing" : currentPhase));
    }, 700),
    window.setTimeout(() => {
      setPhase((currentPhase) =>
        currentPhase === "uploading" || currentPhase === "transcribing"
          ? "extracting"
          : currentPhase,
      );
    }, 1600),
  ];

  return () => {
    timers.forEach((timerId) => window.clearTimeout(timerId));
  };
}
