export class ApiError extends Error {
  constructor(message, status = 500) {
    super(message)
    this.status = status
  }
}

export function apiResponse(data, status = 200) {
  return Response.json(data, { status })
}

export function apiError(error) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status })
  }

  console.error(error)
  return Response.json({ error: 'Internal server error' }, { status: 500 })
}
