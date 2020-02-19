
/**
 * scripts/options.js
 */

"use strict";

(async function()
{
	// Autofill the inputs with the saved preferences
	document.getElementById('input-github-token').value = (await browser.storage.sync.get({ githubPersonalToken: ''})).githubPersonalToken;

	// Save the GitHub token in the sync storage
	document.getElementById('input-github-token').addEventListener('input', async function(e)
	{
		try {
			await browser.storage.sync.set({ githubPersonalToken: e.target.value.trim() });
		}
		catch (err) {
			return;
		}
	});
})();
