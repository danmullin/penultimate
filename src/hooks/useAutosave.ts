import { useEffect, useState } from 'react'
import {
  hasRecoverableWork,
  readAutosave,
  writeAutosave,
} from '../io/autosave'
import { parseProjectJson } from '../io/projectFile'
import { useDocStore } from '../store/documentStore'

const DEBOUNCE_MS = 700

/** Module flag so StrictMode remounts don't wipe the draft with an empty doc. */
let restoreAttempted = false

/**
 * Soft-save: silently write the document to IndexedDB while editing, and
 * restore it on launch if the browser/tab was closed mid-work.
 */
export function useAutosave(): void {
  const [ready, setReady] = useState(restoreAttempted)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      if (!restoreAttempted) {
        restoreAttempted = true
        try {
          const draft = await readAutosave()
          if (!cancelled && draft && hasRecoverableWork(draft.doc)) {
            const normalized = parseProjectJson(JSON.stringify(draft.doc))
            useDocStore.getState().loadDocument(normalized)
            useDocStore.getState().setAutosaveAt(draft.savedAt)
          }
        } catch (err) {
          console.warn('Autosave restore failed', err)
        }
      }
      if (!cancelled) setReady(true)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready) return

    let timer: ReturnType<typeof setTimeout> | undefined
    let writing = false
    let queued = false

    const persist = async () => {
      if (writing) {
        queued = true
        return
      }
      writing = true
      try {
        const doc = useDocStore.getState().doc
        await writeAutosave(doc)
        useDocStore.getState().setAutosaveAt(Date.now())
      } catch (err) {
        console.warn('Autosave write failed', err)
      } finally {
        writing = false
        if (queued) {
          queued = false
          void persist()
        }
      }
    }

    const schedule = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        void persist()
      }, DEBOUNCE_MS)
    }

    const unsub = useDocStore.subscribe((state, prev) => {
      if (state.doc !== prev.doc) schedule()
    })

    const flush = () => {
      if (timer) clearTimeout(timer)
      void persist()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }

    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibility)
    schedule()

    return () => {
      unsub()
      if (timer) clearTimeout(timer)
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [ready])
}
