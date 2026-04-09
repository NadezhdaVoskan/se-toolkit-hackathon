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

  it("groups tasks by weekday and renders the action button", () => {
    const onToggleTaskStatus = vi.fn().mockResolvedValue(undefined);
    const onEditTask = vi.fn().mockResolvedValue(undefined);
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
            due_date: null,
            status: "todo",
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
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mark as done" }));
    expect(onToggleTaskStatus).toHaveBeenCalledTimes(1);
  });
});
