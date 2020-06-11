
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

	// Toggled settings
	['fullRepoName', 'jumpToReadme'].forEach(async setting => {
		document.getElementById(`github:${setting}:` + (await getStorageValue('sync', `github:${setting}`, true, v => typeof v == 'boolean')).toString()).checked = true;
	});

	/**
	 * Save the preferences upon modification & update the targets
	 */

	// Token
	document.getElementById('github:token').addEventListener('input', async function(e)
	{
		await setStorageValue('sync', 'github:token', e.target.value.trim())
		await updateTargets();
	});

	// Toggled settings
	['fullRepoName', 'jumpToReadme'].forEach(function(setting)
	{
		[true, false].forEach(option => document.getElementById(`github:${setting}:${option}`).addEventListener('change', async function(e)
		{
			if (!e.target.checked) return;

			await setStorageValue('sync', `github:${setting}`, option)
			await updateTargets();
		}));
	});
})();

async function updateTargets()
{
	document.getElementById('update-message').classList.add('is-visible');

	await browser.runtime.sendMessage('refresh-data');

	document.getElementById('update-message').classList.remove('is-visible');
}
