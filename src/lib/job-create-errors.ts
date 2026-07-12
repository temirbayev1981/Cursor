export class JobCreateCustomerError extends Error {
  readonly cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'JobCreateCustomerError'
    this.cause = cause
  }
}

export function isJobCreateCustomerError(error: unknown): error is JobCreateCustomerError {
  return error instanceof JobCreateCustomerError
}

export function toJobCreateCustomerError(error: unknown): JobCreateCustomerError | null {
  if (isJobCreateCustomerError(error)) return error
  const message = error instanceof Error ? error.message : String(error ?? '')
  if (/customer|клиент|uuid|foreign key|violates foreign key/i.test(message)) {
    return new JobCreateCustomerError(message, error)
  }
  return null
}
