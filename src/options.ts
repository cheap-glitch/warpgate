import 'typed-query-selector';

import { optionsStorage } from './lib/options-storage';
import { updateGitHubStars } from './lib/github';
import { userAgent, errorToString } from './lib/helpers';

optionsStorage.syncForm(document.querySelector('form')!);

const refreshButton = document.querySelector('button#refresh')!;
refreshButton.addEventListener('click', refreshGitHubRepos);

const tokenField = document.querySelector('input[name="personalToken"]')!;
tokenField!.addEventListener('input', validateToken);
// Wait for the options page to be fully loaded and for the form inputs to be filled
setTimeout(validateToken, 100);

async function refreshGitHubRepos(): Promise<void> {
	refreshButton.disabled = true;
	refreshButton.textContent = 'Updating GitHub stars. This can take a while, please wait…';

	try {
		await updateGitHubStars();
	} catch {
		refreshButton.textContent = 'An error occurred :(';
	} finally {
		refreshButton.disabled = false;
	}

	refreshButton.textContent = 'GitHub stars updated!';
}

async function validateToken(): Promise<void> {
	if (!tokenField.validity.valid || tokenField.value.length === 0) {
		return;
	}

	const statusInfo = document.querySelector('span#token-status')!;
	statusInfo.textContent = 'Validating…';
	delete statusInfo.dataset.status;

	try {
		const scopes = await getTokenScopes(tokenField.value);
		if (!scopes.includes('read:user')) {
			throw new Error('Missing necessary "read:user" scope');
		}

		statusInfo.dataset.status = 'valid';
		statusInfo.textContent = scopes.length > 1
			? '⚠ The token is valid but has some unnecessary scopes. Only "read:user" is required.'
			: 'The token is valid';
	} catch (error) {
		statusInfo.textContent = errorToString(error);
		statusInfo.dataset.status = 'invalid';
	}
}

async function getTokenScopes(personalToken: string): Promise<string[]> {
	const response = await fetch('https://api.github.com', {
		cache: 'no-store',
		headers: {
			'Accept': 'application/vnd.github.v3+json',
			'User-Agent': userAgent,
			'Authorization': `token ${personalToken}`,
		},
	});

	// TODO: Use this in github.ts!
	if (!response.ok) {
		const details = await response.json();
		throw new Error(details.message);
	}

	return response.headers.get('X-OAuth-Scopes')?.split(', ') ?? [];
}
