export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  day_of_week: DayOfWeek | null;
  due_date: string | null;
  status: "todo" | "done";
  source_voice_note_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskDraft = {
  id: string;
  title: string;
  description: string | null;
  day_of_week: DayOfWeek | null;
  due_date: string | null;
  status: "todo" | "done";
  source_voice_note_id: string | null;
};

export type TaskCreatePayload = {
  title: string;
  description: string | null;
  day_of_week: DayOfWeek | null;
  due_date: string | null;
  status?: "todo" | "done";
  source_voice_note_id?: string | null;
};

export type TaskUpdatePayload = {
  title?: string;
  description?: string | null;
  day_of_week?: DayOfWeek | null;
  due_date?: string | null;
  status?: "todo" | "done";
};

export type VoiceNote = {
  id: string;
  original_filename: string;
  transcription_text: string;
  created_at: string;
};

export type UploadVoiceNoteResponse = {
  transcription_text: string;
  voice_note: VoiceNote;
  extracted_tasks: Task[];
};

export type ProcessVoiceNoteResponse = {
  original_filename: string;
  transcription_text: string;
  extracted_tasks: TaskCreatePayload[];
};
