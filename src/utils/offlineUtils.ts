// src/utils/offlineUtils.ts

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the structure of our database and the data it will hold.
interface BillData { /* ... same as your BillData interface in Sales.tsx ... */ }
interface POSDB extends DBSchema {
  'pending-sales': {
    key: string; // The billId will be the key
    value: BillData;
  };
}

const DB_NAME = 'pos-offline-db';
const STORE_NAME = 'pending-sales';
const DB_VERSION = 1;

// Initialize the database connection. This promise resolves to the database instance.
const dbPromise: Promise<IDBPDatabase<POSDB>> = openDB<POSDB>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // This function only runs if the database doesn't exist or the version is updated.
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'billId' });
    }
  },
});

/**
 * Saves a sale record to IndexedDB when the app is offline.
 * @param {BillData} billData - The complete bill data object.
 */
export async function saveSaleOffline(billData: BillData): Promise<void> {
  const db = await dbPromise;
  await db.put(STORE_NAME, billData);
}

/**
 * Retrieves all pending sales from IndexedDB.
 * @returns {Promise<BillData[]>} An array of pending sale objects.
 */
export async function getOfflineSales(): Promise<BillData[]> {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
}

/**
 * Deletes a single sale from IndexedDB after it has been successfully synced.
 * @param {string} billId - The ID of the bill to remove.
 */
export async function deleteSyncedSale(billId: string): Promise<void> {
    const db = await dbPromise;
    await db.delete(STORE_NAME, billId);
}