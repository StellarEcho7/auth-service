import { envValidationSchema } from './env.validation';

const baseEnv = { JWT_ACCESS_SECRET: 'x'.repeat(32) };

const validate = (env: Record<string, unknown>) => {
  const result = envValidationSchema.validate(env, {
    allowUnknown: true,
    abortEarly: false,
  });
  return {
    error: result.error,
    value: result.value as Record<string, unknown>,
  };
};

describe('envValidationSchema', () => {
  it('accepts a minimal environment and applies defaults', () => {
    const { error, value } = validate(baseEnv);

    expect(error).toBeUndefined();
    expect(value).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      JWT_ACCESS_TTL_SECONDS: 900,
      REFRESH_TOKEN_TTL_DAYS: 7,
    });
  });

  it('requires JWT_ACCESS_SECRET', () => {
    const { error } = validate({});

    expect(error?.message).toContain('JWT_ACCESS_SECRET');
  });

  it('rejects a secret shorter than 32 characters', () => {
    const { error } = validate({ JWT_ACCESS_SECRET: 'too-short' });

    expect(error?.message).toContain('JWT_ACCESS_SECRET');
  });

  it('rejects an invalid port', () => {
    const { error } = validate({ ...baseEnv, PORT: '70000' });

    expect(error?.message).toContain('PORT');
  });

  it('rejects a bootstrap email without a password', () => {
    const { error } = validate({
      ...baseEnv,
      BOOTSTRAP_ADMIN_EMAIL: 'admin@example.com',
    });

    expect(error?.message).toContain('BOOTSTRAP_ADMIN_PASSWORD');
  });

  it('rejects a bootstrap password without an email', () => {
    const { error } = validate({
      ...baseEnv,
      BOOTSTRAP_ADMIN_PASSWORD: 'admin-secret',
    });

    expect(error?.message).toContain('BOOTSTRAP_ADMIN_EMAIL');
  });

  it('accepts bootstrap credentials together', () => {
    const { error } = validate({
      ...baseEnv,
      BOOTSTRAP_ADMIN_EMAIL: 'admin@example.com',
      BOOTSTRAP_ADMIN_PASSWORD: 'admin-secret',
    });

    expect(error).toBeUndefined();
  });

  it('treats empty bootstrap values as disabled', () => {
    const { error } = validate({
      ...baseEnv,
      BOOTSTRAP_ADMIN_EMAIL: '',
      BOOTSTRAP_ADMIN_PASSWORD: '',
    });

    expect(error).toBeUndefined();
  });
});
