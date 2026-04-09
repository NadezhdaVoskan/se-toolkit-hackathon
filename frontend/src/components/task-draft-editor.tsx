import React from "react";

import { EnglishDateInput } from "@/components/english-date-input";
import type { TaskDraft } from "@/types/task";

type TaskDraftEditorProps = {
  drafts: TaskDraft[];
  isSaving: boolean;
  onDelete: (taskId: string) => void;
  onFieldChange: (
    taskId: string,
    field: "title" | "description" | "due_date",
    value: string,
  ) => void;
  onSave: () => Promise<void>;
};

export function TaskDraftEditor({
  drafts,
  isSaving,
  onDelete,
  onFieldChange,
  onSave,
}: TaskDraftEditorProps) {
  if (drafts.length === 0) {
    return (
      <p className="mt-4 text-sm leading-6 text-slate-500">
        No clear tasks were detected from this note yet.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {drafts.map((task, index) => (
        <div
          key={task.id}
          className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-4"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">Task {index + 1}</p>
            <button
              className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300"
              onClick={() => {
                onDelete(task.id);
              }}
              type="button"
            >
              Delete
            </button>
          </div>

          <div className="grid gap-3">
            <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Title
              <input
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-900 outline-none transition focus:border-emerald-500"
                onChange={(event) => {
                  onFieldChange(task.id, "title", event.target.value);
                }}
                type="text"
                value={task.title}
              />
            </label>

            <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Description
              <textarea
                className="min-h-20 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm normal-case tracking-normal text-slate-900 outline-none transition focus:border-emerald-500"
                onChange={(event) => {
                  onFieldChange(task.id, "description", event.target.value);
                }}
                value={task.description ?? ""}
              />
            </label>

            <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Date
              <EnglishDateInput
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm normal-case tracking-normal text-slate-900 outline-none transition focus:border-emerald-500"
                onChange={(value) => {
                  onFieldChange(task.id, "due_date", value);
                }}
                value={task.due_date ?? ""}
              />
            </label>
          </div>
        </div>
      ))}

      <button
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        disabled={isSaving}
        onClick={() => {
          void onSave();
        }}
        type="button"
      >
        {isSaving ? "Saving Tasks..." : "Confirm And Save Tasks"}
      </button>
    </div>
  );
}
