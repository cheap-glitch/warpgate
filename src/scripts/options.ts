/* eslint-disable unicorn/prefer-query-selector -- The column makes the selector invalid */
/* eslint-disable @typescript-eslint/no-non-null-assertion -- The option page is fixed */

import { defaultGitHubSettings } from './defaults';
import { getStorageValue, setStorageValue } from './storage';

async function updateTargets(): Promise<void> {
	const updateMessage = document.getElementById('update-message')!;
	updateMessage.classList.add('is-visible');

	await browser.runtime.sendMessage('refresh-data');
	updateMessage.classList.remove('is-visible');
}

(async () => {
	// GitHub token
	document.getElementById('github:token')!.dataset.tokenValue = await getStorageValue('sync', 'github:token') ?? '';
	document.getElementById('github:token')!.addEventListener('input', async event => {
		await setStorageValue('sync', 'github:token', (event.target as HTMLInputElement).dataset.tokenValue!.trim());
		await updateTargets();
	});

	// GitHub settings
	for (const [setting, defaultValue] of Object.keys(defaultGitHubSettings)) {
		const settingCheckboxSelector = `github:${setting}:${await getStorageValue('sync', `github:${setting}`) ?? defaultValue}`;
		(document.getElementById(settingCheckboxSelector) as HTMLInputElement).checked = true;

		for (const option of [true, false]) {
			document
				.getElementById(`github:${setting}:${String(option)}`)!
				.addEventListener('change', async event => {
					if (!(event.target as HTMLInputElement).checked) {
						return;
					}

					await setStorageValue('sync', `github:${setting}`, option);
					await updateTargets();
				});
		}
	}
})();

/* eslint-enable unicorn/prefer-query-selector, @typescript-eslint/no-non-null-assertion -- EOF */
