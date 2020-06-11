
/**
 * scripts/options.js
 */

import { githubSettings }                   from './constants.js'
import { getStorageValue, setStorageValue } from './storage.js'

(async function()
{
	/**
	 * GitHub token
	 */
	document.getElementById('github:token').value = await getStorageValue('sync', 'github:token', '', v => typeof v == 'string');
	document.getElementById('github:token').addEventListener('input', async function(e)
	{
		await setStorageValue('sync', 'github:token', e.target.value.trim())
		await updateTargets();
	});

	/**
	 * GitHub settings
	 */
	Object.keys(githubSettings).forEach(async function(setting)
	{
		document.getElementById(
			`github:${setting}:` + (await getStorageValue('sync', `github:${setting}`, githubSettings[setting], v => typeof v == 'boolean')).toString()
		).checked = true;

		[true, false].forEach(option => document.getElementById(`github:${setting}:${option.toString()}`).addEventListener('change', async function(e)
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
