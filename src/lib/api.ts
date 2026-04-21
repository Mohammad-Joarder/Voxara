import { NextResponse } from 'next/server'

export type ApiSuccess<T> = { data: T }
export type ApiError = { error: string; code: string }
export type ApiResponse<T> = ApiSuccess<T> | ApiError

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ data }, { status })
}

export function fail(message: string, code: string, status = 400) {
  return NextResponse.json<ApiError>({ error: message, code }, { status })
}
