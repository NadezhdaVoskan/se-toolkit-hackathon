import type {
  Task,
  TaskUpdatePayload,
  UploadVoiceNoteResponse,
} from "@/types/task";
import type { AuthCredentials, AuthResponse, User } from "@/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";

export async function registerUser(credentials: AuthCredentials): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  }, "Registration failed.");
}

export async function loginUser(credentials: AuthCredentials): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  }, "Login failed.");
}

export async function fetchCurrentUser(token: string): Promise<User> {
  return apiRequest<User>("/api/auth/me", {
    cache: "no-store",
  }, "Could not load the authenticated user.", token);
}

export async function fetchTasks(token: string): Promise<Task[]> {
  return apiRequest<Task[]>("/api/tasks", {
    cache: "no-store",
  }, "Could not fetch tasks from the backend.", token);
}

export async function uploadAudioNote(
  file: File,
  token: string,
): Promise<UploadVoiceNoteResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<UploadVoiceNoteResponse>("/api/voice-notes/upload", {
    method: "POST",
    body: formData,
  }, "Audio upload failed.", token);
}

export async function updateTask(
  taskId: string,
  payload: TaskUpdatePayload,
  token: string,
): Promise<Task> {
  return apiRequest<Task>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }, "Task update failed.", token);
}

async function apiRequest<T>(
  path: string,
  init: RequestInit,
  fallbackMessage: string,
  token?: string,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

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
