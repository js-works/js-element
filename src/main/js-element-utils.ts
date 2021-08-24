// === exports =======================================================

export { createRef }

// === functions =====================================================

function createRef<T>(initialValue: T | null = null): { value: T | null } {
  return { value: initialValue }
}
