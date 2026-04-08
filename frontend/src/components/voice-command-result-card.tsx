import { SectionCard } from "@/components/section-card";

type VoiceCommandResultCardProps = {
  actionSummary: string;
  transcriptionText: string;
};

export function VoiceCommandResultCard({
  actionSummary,
  transcriptionText,
}: VoiceCommandResultCardProps) {
  return (
    <SectionCard
      title="Voice Command Result"
      description="Review the recognized command text and the action applied to your tasks."
    >
      <div className="grid gap-4">
        <div className="rounded-3xl bg-[linear-gradient(135deg,rgba(250,250,249,0.96),rgba(241,245,249,0.92))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Recognized command
          </p>
          {transcriptionText ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {transcriptionText}
            </p>
          ) : (
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Record and upload a voice command to see the recognized text here.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Action summary
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            {actionSummary || "No command has been processed yet."}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
