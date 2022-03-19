/**
 * Return the value associated with a key in the local storage
 * If the key doesn't exist or the value is invalid, return the default value
 */
export async function getStorageValue(storage, key, defaultValue) {
	let storedValue;

	try {
		storedValue = await browser.storage[storage].get(key);
	} catch (error) {
		console.error(error);
	}

	return storedValue?.[key] ?? defaultValue;
}

/**
 * Set the value of a key in the local storage
 * Create the key if it doesn't exist
 */
export async function setStorageValue(storage, key, valueToStore) {
	try {
		await browser.storage[storage].set({
			[key]: valueToStore,
		});
	} catch (error) {
		console.error(error);
	}
}
