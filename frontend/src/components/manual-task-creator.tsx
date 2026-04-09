import React, { useState } from "react";

import { SectionCard } from "@/components/section-card";
import type { DayOfWeek, TaskCreatePayload } from "@/types/task";

type ManualTaskCreatorProps = {
  isSaving: boolean;
  onCreate: (payload: TaskCreatePayload) => Promise<boolean>;
};

const initialFormState: TaskCreatePayload = {
  title: "",
  description: "",
  day_of_week: null,
  due_date: null,
  status: "todo",
  source_voice_note_id: null,
};

const weekdayOptions: Array<DayOfWeek | ""> = [
  "",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function ManualTaskCreator({ isSaving, onCreate }: ManualTaskCreatorProps) {
  const [formState, setFormState] = useState<TaskCreatePayload>(initialFormState);

  async function handleSubmit() {
    const created = await onCreate({
      ...formState,
      title: formState.title.trim(),
      description: formState.description?.trim() || null,
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

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Day
            <select
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
              onChange={(event) => {
                setFormState((current) => ({
                  ...current,
                  day_of_week: (event.target.value || null) as DayOfWeek | null,
                }));
              }}
              value={formState.day_of_week ?? ""}
            >
              {weekdayOptions.map((option) => (
                <option key={option || "none"} value={option}>
                  {option || "No day"}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Date
            <input
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
              onChange={(event) => {
                setFormState((current) => ({
                  ...current,
                  due_date: event.target.value || null,
                }));
              }}
              type="date"
              value={formState.due_date ?? ""}
            />
          </label>
        </div>

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
