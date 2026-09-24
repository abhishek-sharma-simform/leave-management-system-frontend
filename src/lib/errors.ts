import { AxiosError } from "axios";

/**
 * The backend is not consistent about its error JSON:
 *   - `validate()` middleware  -> { message, errors: [{ path, message }] }
 *   - leaveRequest.controller  -> { error: "..." }
 *   - manager/calendar/auth    -> { message: "..." }
 * Normalising it here means every page can show the server's real message
 * without repeating this guesswork.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | {
          message?: string;
          error?: string;
          errors?: { path: string; message: string }[];
        }
      | undefined;

    const fieldError = data?.errors?.[0];

    if (fieldError) {
      return fieldError.path
        ? `${fieldError.path}: ${fieldError.message}`
        : fieldError.message;
    }

    if (data?.message) return data.message;
    if (data?.error) return data.error;

    if (error.code === "ERR_NETWORK") {
      return "Cannot reach the server. Is the backend running?";
    }
  }

  if (error instanceof Error && error.message) return error.message;

  return "Something went wrong. Please try again.";
}
