import React from "react";
import { SectionCard } from "@/components/section-card";
import type { DayOfWeek, Task } from "@/types/task";

type WeeklyTaskBoardProps = {
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

export function WeeklyTaskBoard({
  tasks,
  updatingTaskId,
  onToggleTaskStatus,
}: WeeklyTaskBoardProps) {
  const groups = weekdayOrder.map((day) => ({
    day,
    items: tasks.filter((task) =>
      day === "Unscheduled" ? task.day_of_week === null : task.day_of_week === day,
    ),
  }));

  return (
    <SectionCard
      title="Weekly Tasks"
      description="Review extracted tasks and manually mark each one as done when you finish it."
      action={
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
          {tasks.length} total
        </span>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {groups.map(({ day, items }) => (
          <section
            key={day}
            className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">
                {day}
              </h3>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                {items.length}
              </span>
            </div>

            <div className="space-y-3">
              {items.length > 0 ? (
                items.map((task) => (
                  <article
                    key={task.id}
                    className={`rounded-2xl border px-4 py-4 transition ${
                      task.status === "done"
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-white bg-white"
                    }`}
                  >
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
                            {task.due_date}
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

                    <button
                      className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
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
    </SectionCard>
  );
}
