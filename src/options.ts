import { optionsStorage } from './lib/options-storage';
import { updateGitHubStars } from './lib/github';

optionsStorage.syncForm(document.querySelector('form')!);

const refreshButton = document.querySelector('#refresh-github-stars') as HTMLButtonElement;
refreshButton.addEventListener('click', async () => {
	refreshButton.disabled = true;
	refreshButton.textContent = 'Updating GitHub stars, please wait…';

	try {
		await updateGitHubStars();
	} catch {
		refreshButton.textContent = 'An error occurred :(';
	} finally {
		refreshButton.disabled = false;
	}

	refreshButton.textContent = 'GitHub stars updated!';
});
