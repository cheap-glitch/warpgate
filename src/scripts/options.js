
/**
 * scripts/options.js
 */

import { getStorageValue, setStorageValue } from './storage.js'

(async function()
{
	// Autofill the inputs with the saved preferences
	document.getElementById('githubPersonalToken').value = await getStorageValue('githubPersonalToken', '', v => typeof v == 'string');
	document.getElementById(`githubSearchRepoName:${await getStorageValue('githubSearchRepoName', 'nameWithOwner', v => ['nameWithOwner', 'nameOnly'].includes(v))}`).checked = true;

	// Save the preferences upon modification & update the targets
	document.getElementById('githubPersonalToken').addEventListener('input', async function(e)
	{
		await setStorageValue('githubPersonalToken', e.target.value.trim())
		await updateTargets();
	});
	['nameWithOwner', 'nameOnly'].forEach(option => document.getElementById(`githubSearchRepoName:${option}`).addEventListener('change', async function(e)
	{
		if (!e.target.checked) return;

		await setStorageValue('githubSearchRepoName', option)
		await updateTargets();
	}));
})();

async function updateTargets()
{
	document.getElementById('update-message').classList.add('is-visible');
	await browser.runtime.sendMessage('[options.js][update targets]');
	document.getElementById('update-message').classList.remove('is-visible');
}
