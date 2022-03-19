/* eslint-disable unicorn/prefer-query-selector -- The column makes the selector invalid */

import { githubSettings } from './constants.js';
import { getStorageValue, setStorageValue } from './storage.js';

async function updateTargets() {
	document.getElementById('update-message').classList.add('is-visible');
	await browser.runtime.sendMessage('refresh-data');
	document.getElementById('update-message').classList.remove('is-visible');
}

(async () => {
	/**
	 * GitHub token
	 */
	document.getElementById('github:token').dataset.tokenValue = await getStorageValue('sync', 'github:token', '');
	document.getElementById('github:token').addEventListener('input', async event => {
		await setStorageValue('sync', 'github:token', event.target.dataset.tokenValue.trim());
		await updateTargets();
	});

	/**
	 * GitHub settings
	 */
	for (const setting of Object.keys(githubSettings)) {
		const settingCheckboxSelector = `github:${setting}:${await getStorageValue('sync', `github:${setting}`, githubSettings[setting])}`;
		document.getElementById(settingCheckboxSelector).checked = true;

		for (const option of [true, false]) {
			document
				.getElementById(`github:${setting}:${String(option)}`)
				.addEventListener('change', async event => {
					if (!event.target.checked) {
						return;
					}

					await setStorageValue('sync', `github:${setting}`, option);
					await updateTargets();
				});
		}
	}
})();

/* eslint-enable unicorn/prefer-query-selector -- EOF */
