/**
 * A simple persistent queue for background updates, using localStorage.
 * This ensures that if a user navigates away or closes the app before an update
 * is saved, we can retry it later.
 *
 * This implementation is kept simple for the specific use case of retrying
 * user profile updates.
 */
import type { UserProfile } from "@/types"

// A unique key for storing the queue in localStorage.
const QUEUE_STORAGE_KEY = "pending-updates-queue"

/**
 * Defines the structure of a single update operation stored in the queue.
 */
export type QueuedUpdate = {
  id: string // A unique ID for the update, typically a timestamp.
  payload: Partial<UserProfile>
  timestamp: number
  attempts: number
}

/**
 * Retrieves the current queue of pending updates from localStorage.
 * Safely handles parsing errors.
 * @returns An array of QueuedUpdate objects.
 */
export function getQueue(): QueuedUpdate[] {
  try {
    const storedQueue = localStorage.getItem(QUEUE_STORAGE_KEY)
    return storedQueue ? JSON.parse(storedQueue) : []
  } catch (error) {
    console.error("Failed to parse retry queue from localStorage:", error)
    // If parsing fails, return an empty queue to prevent app crashes.
    return []
  }
}

/**
 * Saves the provided queue to localStorage.
 * @param queue The array of QueuedUpdate objects to save.
 */
function saveQueue(queue: QueuedUpdate[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue))
  } catch (error) {
    console.error("Failed to save retry queue to localStorage:", error)
  }
}

/**
 * Adds a new update to the queue.
 * @param payload The data for the user profile update.
 */
export function addToQueue(payload: Partial<UserProfile>): void {
  const queue = getQueue()
  const newUpdate: QueuedUpdate = {
    id: `update-${Date.now()}`, // Generate a simple unique ID.
    payload,
    timestamp: Date.now(),
    attempts: 0, // Initialize attempts counter
  }
  queue.push(newUpdate)
  saveQueue(queue)
}

/**
 * Updates a specific item in the queue.
 * @param id The unique ID of the update to modify.
 * @param updates The partial updates to apply to the queued item.
 */
export function updateQueueItem(id: string, updates: Partial<Omit<QueuedUpdate, "id">>): void {
  const queue = getQueue()
  const itemIndex = queue.findIndex((item) => item.id === id)
  if (itemIndex > -1) {
    queue[itemIndex] = { ...queue[itemIndex], ...updates }
    saveQueue(queue)
  }
}

/**
 * Removes a specific update from the queue, typically after it has been
 * successfully processed.
 * @param id The unique ID of the update to remove.
 */
export function removeFromQueue(id:string): void {
  let queue = getQueue()
  queue = queue.filter((item) => item.id !== id)
  saveQueue(queue)
}

/**
 * Clears the entire queue. Can be used for debugging or on user logout.
 */
export function clearQueue(): void {
  try {
    localStorage.removeItem(QUEUE_STORAGE_KEY)
  } catch (error) {
    console.error("Failed to clear retry queue from localStorage:", error)
  }
}
