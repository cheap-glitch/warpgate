
/**
 * scripts/options.js
 */

"use strict";

(async function()
{
	// Save the GitHub token in the sync storage
	document.getElementById('input-github-token').addEventListener('change', function(e)
	{
		try {
			await browser.storage.sync.set({ githubPersonalToken: e.target.value.trim() });
		}
		catch (err) {
			return;
		}
	});
})();
