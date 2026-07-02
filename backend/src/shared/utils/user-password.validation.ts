import { BadRequestException } from '@nestjs/common';

const PASSWORD_MIN_LENGTH = 8;
const COMPLEXITY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

/** Aligns backend validation with frontend auth.validation.ts */
export function assertUserPasswordStrength(password: string): void {
  const value = String(password || '');
  if (value.length < PASSWORD_MIN_LENGTH) {
    throw new BadRequestException(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (!COMPLEXITY.test(value)) {
    throw new BadRequestException(
      'Password must include uppercase, lowercase, a number, and a special character',
    );
  }
}
