'use client'

import type { PresignedClipUploadRequest } from '@/types/clip'

const DB_NAME = 'sappeun-clips'
const STORE_NAME = 'pending_clips'
const DB_VERSION = 1

export interface PendingClipRecord {
  key: string
  clipBlob: Blob
  posterBlob: Blob
  metadata: PresignedClipUploadRequest
  createdAt: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is not available.')
  }

  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode)
    const request = callback(tx.objectStore(STORE_NAME))

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

export async function savePendingClip(
  record: PendingClipRecord,
): Promise<void> {
  await withStore('readwrite', (store) => store.put(record))
}

export async function loadPendingClip(
  key: string,
): Promise<PendingClipRecord | undefined> {
  return withStore('readonly', (store) => store.get(key))
}

export async function deletePendingClip(key: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(key))
}

export function createPendingClipKey(sessionId: string, position: number) {
  return `${sessionId}:${position}:${Date.now()}`
}
