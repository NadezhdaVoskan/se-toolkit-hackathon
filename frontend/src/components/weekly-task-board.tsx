import React, { useState } from "react";

import { EnglishDateInput } from "@/components/english-date-input";
import { SectionCard } from "@/components/section-card";
import type { DayOfWeek, Task, TaskCreatePayload } from "@/types/task";

type TaskStatusFilter = "all" | "todo" | "done";

type WeeklyTaskBoardProps = {
  deletingTaskId: string | null;
  onDeleteTask: (task: Task, scope?: "single" | "future") => Promise<void>;
  onEditTask: (task: Task, payload: TaskCreatePayload) => Promise<boolean>;
  tasks: Task[];
  updatingTaskId: string | null;
  onToggleTaskStatus: (task: Task) => Promise<void>;
};

const weekdayOrder: Array<DayOfWeek | "Unscheduled"> = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
  "Unscheduled",
];

const weekdayIndexMap: Record<DayOfWeek, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

export function WeeklyTaskBoard({
  deletingTaskId,
  onDeleteTask,
  onEditTask,
  tasks,
  updatingTaskId,
  onToggleTaskStatus,
}: WeeklyTaskBoardProps) {
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<TaskCreatePayload | null>(null);
  const [deleteChoiceTaskId, setDeleteChoiceTaskId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all");

  const referenceDate = new Date();
  const currentWeekStart = getStartOfWeek(referenceDate);
  const selectedWeekStart = addDays(currentWeekStart, selectedWeekOffset * 7);
  const selectedWeekEnd = addDays(selectedWeekStart, 6);
  const weekLabel = formatWeekRange(selectedWeekStart, selectedWeekEnd);
  const visibleTasks =
    statusFilter === "all" ? tasks : tasks.filter((task) => task.status === statusFilter);

  const groups = weekdayOrder.map((day) => ({
    day,
    date: day === "Unscheduled" ? null : addDays(selectedWeekStart, weekdayIndexMap[day]),
    items: visibleTasks.filter((task) =>
      belongsToGroup(task, day, selectedWeekStart, selectedWeekEnd, selectedWeekOffset),
    ),
  }));
  const selectedWeekTaskCount = groups.reduce((total, group) => total + group.items.length, 0);

  return (
    <SectionCard
      title="Weekly Tasks"
      description="Review tasks for the selected week and manually mark each one as done when you finish it."
      action={
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
          {tasks.length} total
        </span>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Selected Week
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {weekLabel}
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              onClick={() => {
                setSelectedWeekOffset((current) => current - 1);
              }}
              type="button"
            >
              Previous Week
            </button>
            <button
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              onClick={() => {
                setSelectedWeekOffset(0);
              }}
              type="button"
            >
              Current Week
            </button>
            <button
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              onClick={() => {
                setSelectedWeekOffset((current) => current + 1);
              }}
              type="button"
            >
              Next Week
            </button>
            <button
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              onClick={() => {
                setSelectedWeekOffset(0);
              }}
              type="button"
            >
              Today
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["all", "todo", "done"] as const).map((filterValue) => (
            <button
              key={filterValue}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                statusFilter === filterValue
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
              onClick={() => {
                setStatusFilter(filterValue);
              }}
              type="button"
            >
              {filterValue === "all"
                ? "All"
                : filterValue === "todo"
                  ? "Todo"
                  : "Done"}
            </button>
          ))}
          <span className="text-sm text-slate-500">
            Showing {selectedWeekTaskCount} tasks for this week
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {groups.map(({ day, date, items }) => (
            <section
              key={day}
              className={`relative rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 ${
                items.some((task) => task.id === editingTaskId) ? "z-20" : "z-0"
              }`}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">
                    {day}
                  </h3>
                  {date ? (
                    <p className="mt-1 text-xs font-medium text-slate-400">
                      {formatDayLabel(date)}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                  {items.length}
                </span>
              </div>

              <div className="space-y-3">
                {items.length > 0 ? (
                  items.map((task) => (
                    <article
                      key={task.id}
                      className={`relative rounded-2xl border px-4 py-4 transition ${
                        task.status === "done"
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-white bg-white"
                      } ${editingTaskId === task.id ? "z-30" : "z-0"}`}
                    >
                      {editingTaskId === task.id && editingDraft ? (
                        <div className="space-y-3">
                          <input
                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500"
                            onChange={(event) => {
                              setEditingDraft((current) =>
                                current
                                  ? { ...current, title: event.target.value }
                                  : current,
                              );
                            }}
                            type="text"
                            value={editingDraft.title}
                          />
                          <textarea
                            className="min-h-20 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                            onChange={(event) => {
                              setEditingDraft((current) =>
                                current
                                  ? { ...current, description: event.target.value || null }
                                  : current,
                              );
                            }}
                            value={editingDraft.description ?? ""}
                          />
                          <EnglishDateInput
                            calendarPlacement="top"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                            onChange={(value) => {
                              setEditingDraft((current) =>
                                current
                                  ? {
                                      ...current,
                                      day_of_week: null,
                                      due_date: value || null,
                                    }
                                  : current,
                              );
                            }}
                            value={editingDraft.due_date ?? ""}
                          />

                          <details className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                            <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                              Task settings
                            </summary>
                            <label className="mt-3 flex items-start gap-3 text-sm text-slate-600">
                              <input
                                checked={(editingDraft.recurrence ?? "none") === "weekly"}
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                onChange={(event) => {
                                  setEditingDraft((current) =>
                                    current
                                      ? {
                                          ...current,
                                          recurrence: event.target.checked ? "weekly" : "none",
                                        }
                                      : current,
                                  );
                                }}
                                type="checkbox"
                              />
                              <span>Repeat every week</span>
                            </label>
                          </details>

                          <div className="flex flex-wrap gap-2">
                            <button
                              className="rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                              disabled={updatingTaskId === task.id || !editingDraft.title.trim()}
                              onClick={() => {
                                void onEditTask(task, editingDraft).then((wasSaved) => {
                                  if (!wasSaved) {
                                    return;
                                  }

                                  setEditingTaskId(null);
                                  setEditingDraft(null);
                                });
                              }}
                              type="button"
                            >
                              {updatingTaskId === task.id ? "Saving..." : "Save"}
                            </button>
                            <button
                              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                              onClick={() => {
                                setEditingTaskId(null);
                                setEditingDraft(null);
                              }}
                              type="button"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-2">
                              <p
                                className={`text-sm font-semibold leading-6 ${
                                  task.status === "done"
                                    ? "text-emerald-900 line-through decoration-2"
                                    : "text-slate-900"
                                }`}
                              >
                                {task.title}
                              </p>
                              {task.description ? (
                                <p className="text-sm leading-6 text-slate-500">{task.description}</p>
                              ) : null}
                              {task.due_date ? (
                                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                                  {formatTaskDueDate(task.due_date)}
                                </p>
                              ) : null}
                              {task.recurrence === "weekly" ? (
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                                  Repeats weekly
                                </p>
                              ) : null}
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                                task.status === "done"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {task.status}
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={updatingTaskId === task.id}
                              onClick={() => {
                                void onToggleTaskStatus(task);
                              }}
                              type="button"
                            >
                              {updatingTaskId === task.id
                                ? "Saving..."
                                : task.status === "done"
                                  ? "Mark as todo"
                                  : "Mark as done"}
                            </button>
                            <button
                              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                              onClick={() => {
                                setEditingTaskId(task.id);
                                setEditingDraft({
                                  title: task.title,
                                  description: task.description,
                                  day_of_week: null,
                                  due_date: task.due_date,
                                  recurrence: task.recurrence,
                                  status: task.status,
                                  source_voice_note_id: task.source_voice_note_id,
                                });
                              }}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={deletingTaskId === task.id}
                              onClick={() => {
                                if (task.recurrence === "weekly") {
                                  setDeleteChoiceTaskId((current) =>
                                    current === task.id ? null : task.id,
                                  );
                                  return;
                                }

                                void onDeleteTask(task, "single");
                              }}
                              type="button"
                            >
                              {deletingTaskId === task.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>

                          {task.recurrence === "weekly" && deleteChoiceTaskId === task.id ? (
                            <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50/70 p-3">
                              <p className="text-sm font-medium text-rose-900">
                                Delete just this task or this task and the future repeats?
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  className="rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={deletingTaskId === task.id}
                                  onClick={() => {
                                    void onDeleteTask(task, "single").then(() => {
                                      setDeleteChoiceTaskId(null);
                                    });
                                  }}
                                  type="button"
                                >
                                  Delete this one
                                </button>
                                <button
                                  className="rounded-xl bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                                  disabled={deletingTaskId === task.id}
                                  onClick={() => {
                                    void onDeleteTask(task, "future").then(() => {
                                      setDeleteChoiceTaskId(null);
                                    });
                                  }}
                                  type="button"
                                >
                                  Delete this and future ones
                                </button>
                                <button
                                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                                  onClick={() => {
                                    setDeleteChoiceTaskId(null);
                                  }}
                                  type="button"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </>
                      )}
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-400">
                    No tasks for this day yet.
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function belongsToGroup(
  task: Task,
  group: DayOfWeek | "Unscheduled",
  selectedWeekStart: Date,
  selectedWeekEnd: Date,
  selectedWeekOffset: number,
): boolean {
  if (task.due_date) {
    const dueDate = parseLocalDate(task.due_date);
    if (!dueDate) {
      return group === "Unscheduled";
    }

    if (dueDate < selectedWeekStart || dueDate > selectedWeekEnd) {
      return false;
    }

    if (group === "Unscheduled") {
      return false;
    }

    return getDayOfWeekFromDate(dueDate) === group;
  }

  if (selectedWeekOffset !== 0) {
    return false;
  }

  if (group === "Unscheduled") {
    return task.day_of_week === null;
  }

  return task.day_of_week === group;
}

function getStartOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function addDays(date: Date, amount: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function formatWeekRange(start: Date, end: Date): string {
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`;
  }

  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function parseLocalDate(value: string): Date | null {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function getDayOfWeekFromDate(date: Date): DayOfWeek {
  const index = date.getDay();
  const mapping: DayOfWeek[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return mapping[index];
}

function formatTaskDueDate(value: string): string {
  const parsedDate = parseLocalDate(value);
  if (!parsedDate) {
    return value;
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
