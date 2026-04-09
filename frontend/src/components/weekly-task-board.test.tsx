import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { WeeklyTaskBoard } from "./weekly-task-board";

describe("WeeklyTaskBoard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-09T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("groups tasks by weekday, filters by status, and renders the action buttons", () => {
    const onToggleTaskStatus = vi.fn().mockResolvedValue(undefined);
    const onEditTask = vi.fn().mockResolvedValue(true);
    const onDeleteTask = vi.fn().mockResolvedValue(undefined);

    render(
      <WeeklyTaskBoard
        deletingTaskId={null}
        onDeleteTask={onDeleteTask}
        onEditTask={onEditTask}
        tasks={[
          {
            id: "task-1",
            title: "Finish math homework",
            description: "Chapter 4",
            day_of_week: "Monday",
            due_date: "2026-04-06",
            recurrence: "weekly",
            status: "todo",
            source_voice_note_id: null,
            created_at: "2026-04-05T10:00:00Z",
            updated_at: "2026-04-05T10:00:00Z",
          },
          {
            id: "task-2",
            title: "Submit lab report",
            description: null,
            day_of_week: null,
            due_date: "2026-04-08",
            recurrence: "none",
            status: "done",
            source_voice_note_id: null,
            created_at: "2026-04-05T10:00:00Z",
            updated_at: "2026-04-05T10:00:00Z",
          },
        ]}
        updatingTaskId={null}
        onToggleTaskStatus={onToggleTaskStatus}
      />,
    );

    expect(screen.getByText("Finish math homework")).toBeInTheDocument();
    expect(screen.getByText("Monday")).toBeInTheDocument();
    expect(screen.getByText("Apr 6 - 12")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous Week" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Current Week" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next Week" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Today" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Todo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(2);
    expect(screen.getByText("Repeats weekly")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mark as done" }));
    expect(onToggleTaskStatus).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    expect(screen.getByRole("button", { name: "Delete this one" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete this and future ones" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByText("Finish math homework")).not.toBeInTheDocument();
    expect(screen.getByText("Submit lab report")).toBeInTheDocument();
  });
});
