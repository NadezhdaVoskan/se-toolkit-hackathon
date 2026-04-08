import type {
  Task,
  TaskUpdatePayload,
  UploadVoiceNoteResponse,
  VoiceCommandResponse,
} from "@/types/task";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function fetchTasks(): Promise<Task[]> {
  return apiRequest<Task[]>("/api/tasks", {
    cache: "no-store",
  }, "Could not fetch tasks from the backend.");
}

export async function uploadAudioNote(file: File): Promise<UploadVoiceNoteResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<UploadVoiceNoteResponse>("/api/voice-notes/upload", {
    method: "POST",
    body: formData,
  }, "Audio upload failed.");
}

export async function updateTask(
  taskId: string,
  payload: TaskUpdatePayload,
): Promise<Task> {
  return apiRequest<Task>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }, "Task update failed.");
}

export async function uploadVoiceCommand(file: File): Promise<VoiceCommandResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<VoiceCommandResponse>("/api/voice-commands/upload", {
    method: "POST",
    body: formData,
  }, "Voice command upload failed.");
}

async function apiRequest<T>(
  path: string,
  init: RequestInit,
  fallbackMessage: string,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    const errorMessage = await readErrorMessage(response, fallbackMessage);
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}

async function readErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string };
    return payload.detail ?? fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}
