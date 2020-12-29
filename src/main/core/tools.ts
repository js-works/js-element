import { Ref, Component, Props, UIEvent } from './types'

export function createRef<T>(value: T | null = null): Ref<T> {
  return { current: value }
}

export function createEvent<T extends string, D = null>(
  type: T,
  detail?: D
): UIEvent<T, D> {
  return new CustomEvent(type, {
    detail: detail || null,
    bubbles: true,
    composed: true
  }) as any
}
