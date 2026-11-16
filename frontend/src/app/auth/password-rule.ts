// Keep in step with the @Size and @Pattern rules on the backend password fields
// (RegistrationRequest, ChangePasswordRequest, ResetPasswordRequest).
export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_RULE =
  'At least 8 characters, with 1 uppercase letter, 2 numbers, and 1 special character.';

export function meetsPasswordRule(password: string): boolean {
  const digits = password.match(/\d/g)?.length ?? 0;
  const hasUppercase = /[A-ZÁÉÍÓÖŐÚÜŰ]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9_áéíóöőúüűÁÉÍÓÖŐÚÜŰ\s]/.test(password);
  const hasNoWhitespace = !/\s/.test(password);

  return (
    password.length >= MIN_PASSWORD_LENGTH &&
    digits >= 2 &&
    hasUppercase &&
    hasSpecial &&
    hasNoWhitespace
  );
}
