// [AI-GENERATED]
import { HttpErrorResponse } from '@angular/common/http';

export const CONNECTION_ERROR = "Can't reach CineGrade. Check your connection and try again.";

// The backend's ExceptionResponse. Every field can be missing.
export interface ApiErrorBody {
  businessErrorCode?: number;
  businessErrorDescription?: string;
  error?: string;
  validationErrors?: string[];
  errors?: Record<string, string>;
}

// The generated client reads responses of void endpoints as text, so their errors arrive unparsed.
export function errorBody(err: HttpErrorResponse): ApiErrorBody | null {
  if (typeof err.error !== 'string') {
    return err.error ?? null;
  }
  try {
    return JSON.parse(err.error);
  } catch {
    return null;
  }
}

// Turns a backend error into messages for the user.
// Pass a fallback for the page's own wording when the backend gives nothing specific.
export function errorMessages(err: HttpErrorResponse, fallback: string): string[] {
  if (err.status === 0) {
    return [CONNECTION_ERROR];
  }
  const validation = errorBody(err)?.validationErrors;
  if (validation?.length) {
    return validation;
  }
  return [fallback];
}

// The backend's BusinessErrorCodes number, if the error has one.
export function businessErrorCode(err: HttpErrorResponse): number | undefined {
  return errorBody(err)?.businessErrorCode;
}
