type BrowserStorageLocation = 'local' | 'sync';

/**
 * Return the value associated with a key in the storage location
 * If the key doesn't exist or the value is invalid, return the default value
 */
export async function getStorageValue<T>(storageLocation: BrowserStorageLocation, key: string): Promise<T | undefined> {
	let storedValue;

	try {
		storedValue = await browser.storage[storageLocation].get(key);
	} catch (error) {
		console.error(error);
	}

	return storedValue?.[key];
}

/**
 * Set the value of a key in the storage location
 * Create the key if it doesn't exist
 */
export async function setStorageValue<T>(storageLocation: BrowserStorageLocation, key: string, valueToStore: T): Promise<void> {
	try {
		await browser.storage[storageLocation].set({
			[key]: valueToStore,
		});
	} catch (error) {
		console.error(error);
	}
}
