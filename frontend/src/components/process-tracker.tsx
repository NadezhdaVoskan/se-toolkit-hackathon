import type { WorkflowPhase } from "@/types/workflow";

type ProcessTrackerProps = {
  phase: WorkflowPhase;
  hasRecording: boolean;
};

const steps = [
  { key: "recording", label: "Recording", hint: "Capturing your voice note" },
  { key: "uploading", label: "Uploading", hint: "Sending audio to the backend" },
  { key: "transcribing", label: "Transcribing", hint: "Converting speech to text" },
  { key: "extracting", label: "Extracting Tasks", hint: "Building structured weekly tasks" },
] as const;

export function ProcessTracker({ phase, hasRecording }: ProcessTrackerProps) {
  const progressValue = getProgressValue(phase, hasRecording);
  const progressLabel = getProgressLabel(phase, hasRecording);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-emerald-100 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(240,249,255,0.95))] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{progressLabel}</p>
            <p className="text-xs leading-5 text-slate-500">
              The app will move through upload, transcription, and task extraction automatically.
            </p>
            {(phase === "uploading" || phase === "transcribing" || phase === "extracting") ? (
              <p className="mt-1 text-xs font-semibold text-emerald-700">
                This can take 10-20 seconds.
              </p>
            ) : null}
          </div>
          <span className="shrink-0 text-sm font-semibold text-emerald-700">
            {progressValue}%
          </span>
        </div>

        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/90">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#10b981,#34d399,#6ee7b7,#34d399)] bg-[length:200%_100%] transition-[width] duration-700 ease-out motion-safe:animate-pulse"
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {steps.map((step) => {
          const status = getStepStatus(step.key, phase, hasRecording);

          return (
            <div
              key={step.key}
              className={`rounded-2xl border px-4 py-3 transition ${
                status === "active"
                  ? "border-emerald-300 bg-emerald-50"
                  : status === "done"
                    ? "border-slate-200 bg-slate-50"
                    : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    status === "active"
                      ? "bg-emerald-500"
                      : status === "done"
                        ? "bg-slate-400"
                        : "bg-slate-200"
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                  <p className="text-xs leading-5 text-slate-500">{step.hint}</p>
                </div>
              </div>

              {status === "active" ? (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/80">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-400" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getProgressValue(phase: WorkflowPhase, hasRecording: boolean): number {
  if (phase === "done") {
    return 100;
  }

  if (phase === "extracting") {
    return 88;
  }

  if (phase === "transcribing") {
    return 62;
  }

  if (phase === "uploading") {
    return 34;
  }

  if (phase === "recording") {
    return 12;
  }

  return hasRecording ? 20 : 0;
}

function getProgressLabel(phase: WorkflowPhase, hasRecording: boolean): string {
  if (phase === "done") {
    return "Processing complete";
  }

  if (phase === "extracting") {
    return "Extracting tasks from your transcript";
  }

  if (phase === "transcribing") {
    return "Transcribing your voice note";
  }

  if (phase === "uploading") {
    return "Uploading your audio";
  }

  if (phase === "recording") {
    return "Recording in progress";
  }

  return hasRecording ? "Ready to upload your recording" : "Waiting for a voice note";
}

function getStepStatus(
  step: (typeof steps)[number]["key"],
  phase: WorkflowPhase,
  hasRecording: boolean,
): "idle" | "active" | "done" {
  if (step === "recording") {
    if (phase === "recording") {
      return "active";
    }

    return hasRecording || phase === "done" ? "done" : "idle";
  }

  if (step === "uploading") {
    if (phase === "uploading") {
      return "active";
    }

    return phase === "transcribing" || phase === "extracting" || phase === "done"
      ? "done"
      : "idle";
  }

  if (step === "transcribing") {
    if (phase === "transcribing") {
      return "active";
    }

    return phase === "extracting" || phase === "done" ? "done" : "idle";
  }

  if (phase === "extracting") {
    return "active";
  }

  return phase === "done" ? "done" : "idle";
}
