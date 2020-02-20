
/**
 * src/options.js
 */

"use strict";

(async function()
{
	// Autofill the inputs with the saved preferences
	document.getElementById('githubPersonalToken').value = await getStorageValue('githubPersonalToken', '', v => typeof v == 'string');
	document.getElementById(`githubSearchRepoName:${await getStorageValue('githubSearchRepoName', 'nameWithOwner', v => ['nameWithOwner', 'nameOnly'].includes(v))}`).checked = true;

	// Save the preferences upon modification
	document.getElementById('githubPersonalToken').addEventListener('input', async e => await setStorageValue('githubPersonalToken', e.target.value.trim()));
	['nameWithOwner', 'nameOnly'].forEach(option => document.getElementById(`githubSearchRepoName:${option}`).addEventListener('change', async e => { if (e.target.checked) await setStorageValue('githubSearchRepoName', option) }));
})();
