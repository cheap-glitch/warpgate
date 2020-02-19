
/**
 * scripts/storage.js
 */

/**
 * Return the value associated with a key in the local storage
 * If the key doesn't exist or the value is invalid, return the default value
 */
async function getStorageValue(key, defaultValue, validator)
{
	let wrap = null;

	try {
		wrap = await browser.storage.sync.get(key);
	}
	catch (err) {
		return defaultValue;
	}

	// Unwrap the value
	const { value } = wrap;

	return validator(value[key]) ? value[key] : defaultValue;
}

/**
 * Set the value of a key in the local storage
 * Create the key if it doesn't exist
 */
async function setStorageValue(key, value)
{
	try {
		await browser.storage.sync.set({ key: value });
	}
	catch (err) {
		return false;
	}

	return true;
}
