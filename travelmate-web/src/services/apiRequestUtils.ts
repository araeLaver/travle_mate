type QueryParamValue = string | number | boolean | null | undefined;

export const getApiErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  return fallbackMessage;
};

export const withServiceError = async <T>(
  request: Promise<T>,
  fallbackMessage: string
): Promise<T> => {
  try {
    return await request;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, fallbackMessage));
  }
};

export const appendQuery = (endpoint: string, params: Record<string, QueryParamValue>): string => {
  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)])
    )
  ).toString();

  return query ? `${endpoint}?${query}` : endpoint;
};
