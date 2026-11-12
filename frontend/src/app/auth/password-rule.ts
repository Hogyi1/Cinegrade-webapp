// Keep in step with the @Size and @Pattern rules on the backend password fields
// (RegistrationRequest, ChangePasswordRequest, ResetPasswordRequest).
export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_RULE = 'At least 8 characters, with 2 numbers and 1 special character.';

export function meetsPasswordRule(password: string): boolean {
  const digits = password.match(/\d/g)?.length ?? 0;
  return password.length >= MIN_PASSWORD_LENGTH && digits >= 2 && /[^a-zA-Z0-9\s]/.test(password);
}
