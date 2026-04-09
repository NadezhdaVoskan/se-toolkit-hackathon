import React, { useState } from "react";

import { EnglishDateInput } from "@/components/english-date-input";
import { SectionCard } from "@/components/section-card";
import type { TaskCreatePayload } from "@/types/task";

type ManualTaskCreatorProps = {
  isSaving: boolean;
  onCreate: (payload: TaskCreatePayload) => Promise<boolean>;
};

const initialFormState: TaskCreatePayload = {
  title: "",
  description: "",
  day_of_week: null,
  due_date: null,
  recurrence: "none",
  status: "todo",
  source_voice_note_id: null,
};

export function ManualTaskCreator({ isSaving, onCreate }: ManualTaskCreatorProps) {
  const [formState, setFormState] = useState<TaskCreatePayload>(initialFormState);

  async function handleSubmit() {
    const created = await onCreate({
      ...formState,
      title: formState.title.trim(),
      description: formState.description?.trim() || null,
      day_of_week: null,
      recurrence: formState.recurrence ?? "none",
      source_voice_note_id: null,
      status: "todo",
    });
    if (created) {
      setFormState(initialFormState);
    }
  }

  return (
    <SectionCard
      title="Create Task Manually"
      description="Add a task even when you do not want to use voice input."
    >
      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Title
          <input
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
            onChange={(event) => {
              setFormState((current) => ({ ...current, title: event.target.value }));
            }}
            placeholder="Add a task title"
            type="text"
            value={formState.title}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Description
          <textarea
            className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
            onChange={(event) => {
              setFormState((current) => ({ ...current, description: event.target.value }));
            }}
            placeholder="Optional details"
            value={formState.description ?? ""}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Date
          <EnglishDateInput
            calendarPlacement="top"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
            onChange={(value) => {
              setFormState((current) => ({
                ...current,
                due_date: value || null,
              }));
            }}
            value={formState.due_date ?? ""}
          />
        </label>

        <details className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            Task settings
          </summary>
          <label className="mt-3 flex items-start gap-3 text-sm text-slate-600">
            <input
              checked={(formState.recurrence ?? "none") === "weekly"}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              onChange={(event) => {
                setFormState((current) => ({
                  ...current,
                  recurrence: event.target.checked ? "weekly" : "none",
                }));
              }}
              type="checkbox"
            />
            <span>
              Repeat every week
            </span>
          </label>
        </details>

        <button
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isSaving || !formState.title.trim()}
          onClick={() => {
            void handleSubmit();
          }}
          type="button"
        >
          {isSaving ? "Creating Task..." : "Create Task Manually"}
        </button>
      </div>
    </SectionCard>
  );
}
