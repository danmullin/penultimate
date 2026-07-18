import { useRef } from 'react'
import { useDocStore } from '../store/documentStore'

/**
 * One undo checkpoint per color-picker open session.
 * First live change pushes history; Cancel undoes; OK keeps the preview.
 */
export function useColorPickerSession() {
  const dirty = useRef(false)

  return {
    /** Call before applying a live preview color. Returns whether to record history. */
    beginChange(): boolean {
      if (dirty.current) return false
      dirty.current = true
      return true
    },
    cancel() {
      if (!dirty.current) return
      useDocStore.getState().undo()
      dirty.current = false
    },
    commit() {
      dirty.current = false
    },
  }
}
