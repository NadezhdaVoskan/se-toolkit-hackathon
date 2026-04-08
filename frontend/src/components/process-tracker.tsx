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
  return (
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
          </div>
        );
      })}
    </div>
  );
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
