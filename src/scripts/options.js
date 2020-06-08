
/**
 * scripts/options.js
 */

import { getStorageValue, setStorageValue } from './storage.js'

(async function()
{
	/**
	 * Autofill the inputs with the saved preferences
	 */

	// Token
	document.getElementById('github:token').value = await getStorageValue('sync', 'github:token', '', v => typeof v == 'string');

	// Full name / repo name only
	document.getElementById('github:fullRepoName:' + (await getStorageValue('sync', 'github:fullRepoName', true, v => typeof v == 'boolean')).toString()).checked = true;

	/**
	 * Save the preferences upon modification & update the targets
	 */

	// Token
	document.getElementById('github:token').addEventListener('input', async function(e)
	{
		await setStorageValue('sync', 'github:token', e.target.value.trim())
		await updateTargets();
	});

	// Full name
	[true, false].forEach(option => document.getElementById(`github:fullRepoName:${option}`).addEventListener('change', async function(e)
	{
		if (!e.target.checked) return;

		await setStorageValue('sync', 'github:fullRepoName', option)
		await updateTargets();
	}));
})();

async function updateTargets()
{
	document.getElementById('update-message').classList.add('is-visible');

	await browser.runtime.sendMessage('refresh-data');

	document.getElementById('update-message').classList.remove('is-visible');
}
