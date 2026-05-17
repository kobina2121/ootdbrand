export type ApiEnvelope<T> = {
  ok: boolean;
  message: string;
  data: T;
};

export function success<T>(message: string, data: T): ApiEnvelope<T> {
  return {
    ok: true,
    message,
    data,
  };
}

export function failure(message: string, data: Record<string, never> = {}) {
  return {
    ok: false,
    message,
    data,
  };
}
