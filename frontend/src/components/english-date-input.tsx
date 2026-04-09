import React, { useEffect, useState } from "react";

type EnglishDateInputProps = {
  className?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

export function EnglishDateInput({
  className,
  onChange,
  placeholder = "MM/DD/YYYY",
  value,
}: EnglishDateInputProps) {
  const [displayValue, setDisplayValue] = useState(formatIsoDateToEnglish(value));

  useEffect(() => {
    setDisplayValue(formatIsoDateToEnglish(value));
  }, [value]);

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

  return (
    <input
      className={className}
      inputMode="numeric"
      onBlur={handleBlur}
      onChange={(event) => {
        handleInputChange(event.target.value);
      }}
      placeholder={placeholder}
      type="text"
      value={displayValue}
    />
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

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
