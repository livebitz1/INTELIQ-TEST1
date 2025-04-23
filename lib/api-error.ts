export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof APIError) {
    return {
      statusCode: error.statusCode,
      body: JSON.stringify({
        error: error.message,
        details: error.details,
      }),
    };
  }

  if (error instanceof Error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      }),
    };
  }

  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    }),
  };
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorHandler: (error: unknown) => never = (error) => {
    throw error;
  }
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    return errorHandler(error);
  }
} 