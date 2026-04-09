import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { WeeklyTaskBoard } from "./weekly-task-board";

describe("WeeklyTaskBoard", () => {
  it("groups tasks by weekday and renders the action button", () => {
    const onToggleTaskStatus = vi.fn().mockResolvedValue(undefined);

    render(
      <WeeklyTaskBoard
        tasks={[
          {
            id: "task-1",
            title: "Finish math homework",
            description: "Chapter 4",
            day_of_week: "Monday",
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

    fireEvent.click(screen.getByRole("button", { name: "Mark as done" }));
    expect(onToggleTaskStatus).toHaveBeenCalledTimes(1);
  });
});
