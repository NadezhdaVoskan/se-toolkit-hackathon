import type { ReactNode } from "react";
import type { Task, TaskDraft } from "@/types/task";
import { SectionCard } from "@/components/section-card";
import { TaskDraftEditor } from "@/components/task-draft-editor";

type TranscriptionCardProps = {
  transcriptionText: string;
  detectedTasks: TaskDraft[];
  isSavingDetectedTasks: boolean;
  onDeleteDetectedTask: (taskId: string) => void;
  onDetectedTaskFieldChange: (
    taskId: string,
    field: "title" | "description" | "due_date",
    value: string,
  ) => void;
  onSaveDetectedTasks: () => Promise<void>;
};

export function TranscriptionCard({
  transcriptionText,
  detectedTasks,
  isSavingDetectedTasks,
  onDeleteDetectedTask,
  onDetectedTaskFieldChange,
  onSaveDetectedTasks,
}: TranscriptionCardProps) {
  const transcriptionLines = buildTranscriptionLines(transcriptionText);

  return (
    <SectionCard
      title="Transcription Result"
      description="This is the text the backend returned after processing the uploaded audio."
    >
      <div className="space-y-4 rounded-3xl bg-[linear-gradient(135deg,rgba(250,250,249,0.96),rgba(241,245,249,0.92))] p-5">
        {transcriptionText ? (
          <>
            <div className="space-y-2">
              {transcriptionLines.map((line, index) => (
                <p
                  key={`${line}-${index}`}
                  className="rounded-2xl bg-white/70 px-3 py-2 text-sm leading-7 text-slate-700"
                >
                  {renderHighlightedLine(line, detectedTasks)}
                </p>
              ))}
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                    Detected Tasks From This Note
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Review, edit, or remove tasks before saving them to your board.
                  </p>
                </div>
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {detectedTasks.length}
                </div>
              </div>

              <TaskDraftEditor
                drafts={detectedTasks}
                isSaving={isSavingDetectedTasks}
                onDelete={onDeleteDetectedTask}
                onFieldChange={onDetectedTaskFieldChange}
                onSave={onSaveDetectedTasks}
              />
            </div>
          </>
        ) : (
          <p className="text-sm leading-7 text-slate-400">
            No transcription yet. Record and upload a voice note to see the result here.
          </p>
        )}
      </div>
    </SectionCard>
  );
}

function buildTranscriptionLines(transcriptionText: string): string[] {
  const normalizedText = transcriptionText.replace(/\s+/g, " ").trim();
  if (!normalizedText) {
    return [];
  }

  const sentenceParts = normalizedText
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (sentenceParts.length > 1) {
    return sentenceParts;
  }

  return normalizedText
    .split(/\b(?=add|book|buy|call|check|complete|email|finish|move|plan|prepare|review|schedule|send|submit|write|remind)\b/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function renderHighlightedLine(line: string, tasks: Array<Pick<TaskDraft, "title" | "description">>) {
  const highlightPhrases = tasks
    .flatMap((task) => [task.title, task.description ?? ""])
    .map((phrase) => phrase.trim())
    .filter((phrase) => phrase.length >= 4)
    .sort((left, right) => right.length - left.length);

  if (highlightPhrases.length === 0) {
    return line;
  }

  const matches: Array<{ start: number; end: number }> = [];
  const lowerLine = line.toLowerCase();

  for (const phrase of highlightPhrases) {
    const lowerPhrase = phrase.toLowerCase();
    let startIndex = 0;

    while (startIndex < lowerLine.length) {
      const matchIndex = lowerLine.indexOf(lowerPhrase, startIndex);
      if (matchIndex === -1) {
        break;
      }

      const nextMatch = {
        start: matchIndex,
        end: matchIndex + lowerPhrase.length,
      };
      const overlapsExisting = matches.some(
        (match) => nextMatch.start < match.end && nextMatch.end > match.start,
      );

      if (!overlapsExisting) {
        matches.push(nextMatch);
      }

      startIndex = matchIndex + lowerPhrase.length;
    }
  }

  if (matches.length === 0) {
    return line;
  }

  matches.sort((left, right) => left.start - right.start);

  const fragments: ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    if (cursor < match.start) {
      fragments.push(line.slice(cursor, match.start));
    }

    fragments.push(
      <mark
        key={`${match.start}-${match.end}-${index}`}
        className="rounded-lg bg-emerald-100 px-1.5 py-0.5 text-slate-900"
      >
        {line.slice(match.start, match.end)}
      </mark>,
    );

    cursor = match.end;
  });

  if (cursor < line.length) {
    fragments.push(line.slice(cursor));
  }

  return fragments;
}
