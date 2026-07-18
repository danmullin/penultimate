import type { VectorDocument } from '../types'

const DB_NAME = 'penultimate-autosave'
const DB_VERSION = 1
const STORE = 'drafts'
const DRAFT_KEY = 'current'

export type AutosavePayload = {
  savedAt: number
  doc: VectorDocument
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
  })
}

/** Persist the live document for crash / tab-close recovery. */
export async function writeAutosave(doc: VectorDocument): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('Autosave write failed'))
      tx.objectStore(STORE).put(
        { savedAt: Date.now(), doc } satisfies AutosavePayload,
        DRAFT_KEY,
      )
    })
  } finally {
    db.close()
  }
}

export async function readAutosave(): Promise<AutosavePayload | null> {
  const db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      tx.onerror = () => reject(tx.error ?? new Error('Autosave read failed'))
      const req = tx.objectStore(STORE).get(DRAFT_KEY)
      req.onsuccess = () => {
        const value = req.result as AutosavePayload | undefined
        if (!value?.doc || typeof value.doc !== 'object') resolve(null)
        else resolve(value)
      }
      req.onerror = () => reject(req.error ?? new Error('Autosave get failed'))
    })
  } finally {
    db.close()
  }
}

export async function clearAutosave(): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('Autosave clear failed'))
      tx.objectStore(STORE).delete(DRAFT_KEY)
    })
  } finally {
    db.close()
  }
}

/** True when the draft has something worth recovering. */
export function hasRecoverableWork(doc: VectorDocument): boolean {
  if (Object.keys(doc.nodes).length > 0) return true
  if (doc.artboards.length > 1) return true
  if ((doc.manualGuides?.length ?? 0) > 0) return true
  if (doc.name && doc.name !== 'Untitled') return true
  return false
}
