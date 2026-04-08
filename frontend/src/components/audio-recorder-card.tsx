import { ProcessTracker } from "@/components/process-tracker";
import { SectionCard } from "@/components/section-card";
import type { WorkflowPhase } from "@/types/workflow";

type AudioRecorderCardProps = {
  audioPreviewUrl: string | null;
  canUpload: boolean;
  fileInputId: string;
  isProcessing: boolean;
  isRecording: boolean;
  isRecorderSupported: boolean;
  phase: WorkflowPhase;
  previewEmptyText: string;
  previewTitle: string;
  title: string;
  uploadLabel: string;
  description: string;
  onFileSelected: (file: File | null) => void;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => void;
  onUpload: () => Promise<void>;
};

export function AudioRecorderCard({
  audioPreviewUrl,
  canUpload,
  fileInputId,
  isProcessing,
  isRecording,
  isRecorderSupported,
  phase,
  previewEmptyText,
  previewTitle,
  title,
  uploadLabel,
  description,
  onFileSelected,
  onStartRecording,
  onStopRecording,
  onUpload,
}: AudioRecorderCardProps) {
  const statusLabel = getStatusLabel(phase, isRecording, canUpload);

  return (
    <SectionCard
      title={title}
      description={description}
      action={
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
          {statusLabel}
        </span>
      }
    >
      <div className="space-y-5">
        <ProcessTracker phase={phase} hasRecording={canUpload} />

        {!isRecorderSupported ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your browser does not support microphone recording with the MediaRecorder API.
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={!isRecorderSupported || isRecording || isProcessing}
            onClick={() => {
              void onStartRecording();
            }}
            type="button"
          >
            Start Recording
          </button>
          <button
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
            disabled={!isRecording}
            onClick={onStopRecording}
            type="button"
          >
            Stop Recording
          </button>
          <label
            className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
            htmlFor={fileInputId}
          >
            Choose Audio File
          </label>
          <input
            accept="audio/*"
            className="sr-only"
            id={fileInputId}
            onChange={(event) => {
              onFileSelected(event.target.files?.[0] ?? null);
              event.currentTarget.value = "";
            }}
            type="file"
          />
          <button
            className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            disabled={!canUpload || isRecording || isProcessing}
            onClick={() => {
              void onUpload();
            }}
            type="button"
          >
            {uploadLabel}
          </button>
        </div>

        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-sm font-medium text-slate-700">{previewTitle}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {audioPreviewUrl
              ? "Listen back before uploading."
              : `${previewEmptyText} You can also choose an existing audio file.`}
          </p>
          {audioPreviewUrl ? (
            <audio className="mt-4 w-full" controls src={audioPreviewUrl}>
              Your browser does not support the audio element.
            </audio>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}

function getStatusLabel(
  phase: WorkflowPhase,
  isRecording: boolean,
  canUpload: boolean,
): string {
  if (isRecording || phase === "recording") {
    return "Recording";
  }

  if (phase === "uploading") {
    return "Uploading";
  }

  if (phase === "transcribing") {
    return "Transcribing";
  }

  if (phase === "extracting") {
    return "Extracting";
  }

  if (phase === "done") {
    return "Completed";
  }

  return canUpload ? "Ready to upload" : "Idle";
}
