import React, { useEffect, useMemo, useRef, useState } from "react";

type EnglishDateInputProps = {
  calendarPlacement?: "bottom" | "top";
  className?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function EnglishDateInput({
  calendarPlacement = "bottom",
  className,
  onChange,
  placeholder = "MM/DD/YYYY",
  value,
}: EnglishDateInputProps) {
  const [displayValue, setDisplayValue] = useState(formatIsoDateToEnglish(value));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedDate = useMemo(() => parseIsoDate(value), [value]);
  const [visibleMonth, setVisibleMonth] = useState(() => getInitialVisibleMonth(value));

  useEffect(() => {
    setDisplayValue(formatIsoDateToEnglish(value));
    if (selectedDate) {
      setVisibleMonth(startOfMonth(selectedDate));
    }
  }, [selectedDate, value]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCalendarOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleInputChange(nextValue: string) {
    setDisplayValue(nextValue);

    if (!nextValue.trim()) {
      onChange("");
      return;
    }

    const parsedValue = parseEnglishDate(nextValue);
    if (parsedValue) {
      onChange(parsedValue);
    }
  }

  function handleBlur() {
    const parsedValue = parseEnglishDate(displayValue);
    if (!displayValue.trim()) {
      setDisplayValue("");
      onChange("");
      return;
    }

    if (!parsedValue) {
      setDisplayValue(formatIsoDateToEnglish(value));
      return;
    }

    const formattedValue = formatIsoDateToEnglish(parsedValue);
    setDisplayValue(formattedValue);
    onChange(parsedValue);
  }

  function handleDaySelect(day: Date) {
    const isoDate = formatDateToIso(day);
    onChange(isoDate);
    setDisplayValue(formatIsoDateToEnglish(isoDate));
    setVisibleMonth(startOfMonth(day));
    setIsCalendarOpen(false);
  }

  const calendarDays = buildCalendarDays(visibleMonth);
  const visibleMonthLabel = visibleMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          className={className ? `${className} pr-12` : undefined}
          inputMode="numeric"
          onBlur={handleBlur}
          onChange={(event) => {
            handleInputChange(event.target.value);
          }}
          onFocus={() => {
            setIsCalendarOpen(true);
          }}
          placeholder={placeholder}
          type="text"
          value={displayValue}
        />
        <button
          aria-label="Open calendar"
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-700"
          onClick={() => {
            setIsCalendarOpen((current) => !current);
          }}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <rect
              height="15"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.7"
              width="18"
              x="3"
              y="5"
            />
            <path d="M3 9.5h18" stroke="currentColor" strokeWidth="1.7" />
            <path d="M8 3v4M16 3v4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
          </svg>
        </button>
      </div>

      {isCalendarOpen ? (
        <div
          className={`absolute left-0 z-20 w-[18rem] rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.35)] ${
            calendarPlacement === "top"
              ? "bottom-[calc(100%+0.5rem)]"
              : "top-[calc(100%+0.5rem)]"
          }`}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              onClick={() => {
                setVisibleMonth((current) => addMonths(current, -1));
              }}
              type="button"
            >
              Prev
            </button>
            <p className="text-sm font-semibold text-slate-900">{visibleMonthLabel}</p>
            <button
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              onClick={() => {
                setVisibleMonth((current) => addMonths(current, 1));
              }}
              type="button"
            >
              Next
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="py-1">
                {label}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const isSelected =
                selectedDate !== null && isSameDate(day.date, selectedDate);

              return (
                <button
                  key={day.date.toISOString()}
                  className={`rounded-xl px-0 py-2 text-sm transition ${
                    day.isCurrentMonth
                      ? isSelected
                        ? "bg-emerald-600 font-semibold text-white"
                        : "text-slate-700 hover:bg-slate-100"
                      : "text-slate-300 hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    handleDaySelect(day.date);
                  }}
                  type="button"
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatIsoDateToEnglish(value: string): string {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return "";
  }

  return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}`;
}

function parseEnglishDate(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) {
    return null;
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return formatDateToIso(parsedDate);
}

function parseIsoDate(value: string): Date | null {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatDateToIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getInitialVisibleMonth(value: string): Date {
  const parsedDate = parseIsoDate(value);
  return startOfMonth(parsedDate ?? new Date());
}

function buildCalendarDays(month: Date): Array<{ date: Date; isCurrentMonth: boolean }> {
  const monthStart = startOfMonth(month);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date,
      isCurrentMonth: date.getMonth() === month.getMonth(),
    };
  });
}

function isSameDate(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}
