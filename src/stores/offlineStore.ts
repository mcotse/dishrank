import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OfflineQueueItem, DishEntryData } from '../types'

interface ComparisonData {
  dishAId: string
  dishBId: string
  winnerId: string | null
  skipped: boolean
}

interface OfflineState {
  // Queue of pending operations
  queue: OfflineQueueItem[]

  // Online status
  isOnline: boolean

  // Syncing status
  isSyncing: boolean

  // Actions
  setOnline: (online: boolean) => void
  setSyncing: (syncing: boolean) => void

  // Queue dish entry for offline sync
  queueDishEntry: (data: DishEntryData) => string

  // Queue comparison for offline sync
  queueComparison: (data: ComparisonData) => string

  // Remove item from queue (after successful sync)
  removeFromQueue: (id: string) => void

  // Increment retry count for failed item
  incrementRetry: (id: string) => void

  // Clear entire queue
  clearQueue: () => void

  // Get pending items
  getPendingItems: () => OfflineQueueItem[]
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      queue: [],
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: false,

      setOnline: (isOnline) => set({ isOnline }),

      setSyncing: (isSyncing) => set({ isSyncing }),

      queueDishEntry: (data) => {
        const id = generateId()
        const item: OfflineQueueItem = {
          id,
          type: 'dish_entry',
          data,
          createdAt: Date.now(),
          retryCount: 0,
        }

        set((state) => ({
          queue: [...state.queue, item],
        }))

        return id
      },

      queueComparison: (data) => {
        const id = generateId()
        const item: OfflineQueueItem = {
          id,
          type: 'comparison',
          data,
          createdAt: Date.now(),
          retryCount: 0,
        }

        set((state) => ({
          queue: [...state.queue, item],
        }))

        return id
      },

      removeFromQueue: (id) =>
        set((state) => ({
          queue: state.queue.filter((item) => item.id !== id),
        })),

      incrementRetry: (id) =>
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id ? { ...item, retryCount: item.retryCount + 1 } : item
          ),
        })),

      clearQueue: () => set({ queue: [] }),

      getPendingItems: () => {
        const { queue } = get()
        // Filter out items with too many retries (max 5)
        return queue.filter((item) => item.retryCount < 5)
      },
    }),
    {
      name: 'dishrank-offline-queue',
    }
  )
)

// Set up online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineStore.getState().setOnline(true)
  })

  window.addEventListener('offline', () => {
    useOfflineStore.getState().setOnline(false)
  })
}
