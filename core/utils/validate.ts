import { RouteError } from './route-error.ts';

/** trim e não aceita string vazia */
function string(x: unknown) {
  if (typeof x !== 'string' || x.trim().length === 0) return undefined;

  const s = x.trim();
  if (s.length === 0) return undefined;

  return s;
}

/** se a string for number like retorna number */
function number(x: unknown) {
  if (typeof x === 'number') return Number.isFinite(x) ? x : undefined;

  if (typeof x === 'string' && x.trim().length !== 0) {
    const n = Number(x);
    return Number.isFinite(n) ? n : undefined;
  }

  return undefined;
}

/** aceita valores true, 1 , '1', 'true' */
function boolean(x: unknown) {
  if (x === true || x === 'true' || x === 1 || x === '1' || x === 'on') return true;
  if (x === false || x === 'false' || x === 0 || x === '0' || x === 'off') return false;
  return undefined;
}

/** verifica se é um objeto {} */
function object(x: unknown): Record<string, unknown> | undefined {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : undefined;
}

function email(x: unknown) {
  const email_regex = /^[^@]+@[^@]+\.[^@]+$/;
  const s = string(x)?.toLowerCase();

  if (s === undefined) return undefined;

  return email_regex.test(s) ? s : undefined;
}

/** min 10 e max 256 e pelo menos 1 caixa alta e 1 baixa e 1 digito */
function password(x: unknown) {
  const password_regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

  if (typeof x !== 'string') return undefined;
  if (x.length < 10 || x.length > 256) return undefined;

  return password_regex.test(x) ? x : undefined;
}

type Parse<Value> = (x: unknown) => Value | undefined;

function required<Value>(fn: Parse<Value>, error: string) {
  return (x: unknown) => {
    const value = fn(x);

    if (value === undefined) throw new RouteError(422, error);
    return value;
  };
}

export const validate = {
  string: required(string, 'string esperada'),
  number: required(number, 'number esperado'),
  boolean: required(boolean, 'boolean esperado'),
  object: required(object, 'object esperado'),
  email: required(email, 'email invalido'),
  password: required(password, 'password invalido'),
  optional: {
    string,
    number,
    boolean,
    object,
    email,
    password,
  },
};
