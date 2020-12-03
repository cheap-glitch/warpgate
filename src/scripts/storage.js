/**
 * Return the value associated with a key in the local storage
 * If the key doesn't exist or the value is invalid, return the default value
 */
export async function getStorageValue(storage, key, defaultValue, validator) {
	let value = null;

	try {
		value = await browser.storage[storage].get(key);
	} catch (err) {
		console.error(err);

		return defaultValue;
	}

	return validator(value[key]) ? value[key] : defaultValue;
}

/**
 * Set the value of a key in the local storage
 * Create the key if it doesn't exist
 */
export async function setStorageValue(storage, key, value) {
	try {
		await browser.storage[storage].set({ [key]: value });
	} catch (err) {
		console.error(err);
	}
}
