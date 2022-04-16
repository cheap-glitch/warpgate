/*
 *                             _____  __
 *  _    _____ ________  ___ _/ ___ \/ /____
 * | |/|/ / _ `/ __/ _ \/ _ `/ / _ `/ __/ -_)
 * |__,__/\_,_/_/ / .__/\_, /\ \_,_/\__/\__/
 *               /_/   /___/  \___/
 *
 * A lightweight browser extension to jump to various external bookmarks from
 * the address bar.
 *
 * Copyright (c) 2020-present, cheap glitch
 * This software is distributed under the Mozilla Public License 2.0
 */

import { getDatabase } from './lib/database';
import { errorToString } from './lib/helpers';
import { optionsStorage } from './lib/options-storage';
import { notify, openUrl } from './lib/helpers/browser';
import { updateGitHubStars } from './lib/github';
import { searchGitHubRepos } from './lib/search';
import { getGitHubSearchUrl } from './lib/helpers/github';

import type { GitHubRepo } from './lib/github';

(async () => {
	const database = await getDatabase();
	let currentInput = '';
	let repos: GitHubRepo[] | undefined;

	// TODO: Rename function
	async function updateGitHubRepos(): Promise<void> {
		const { sortBy } = await optionsStorage.getAll();

		// TODO: Show notification (or at least log the error) + same in options.ts
		if (sortBy === 'starredAt') {
			repos = await database.getAllFromIndex('starredGitHubRepos', 'starredAt');
			repos.reverse();
		} else {
			repos = await database.getAll('starredGitHubRepos');
		}
	}

	// Refresh data every 30 minutes
	window.setInterval(
		async () => {
			await updateGitHubRepos();
		},
		1000 * 60 * 30,
	);

	browser.omnibox.setDefaultSuggestion({
		description: '🔍 Search on GitHub',
	});

	browser.omnibox.onInputStarted.addListener(async () => {
		if (!repos || repos.length === 0) {
			await updateGitHubRepos();
		}
	});

	browser.omnibox.onInputChanged.addListener((input, suggest) => {
		currentInput = input;
		suggest(searchGitHubRepos(repos ?? [], input));
	});

	browser.omnibox.onInputEntered.addListener(async (url, disposition) => {
		if (!url.startsWith('https://')) {
			// If the first "suggestion" is selected, perform a search on GitHub
			openUrl(getGitHubSearchUrl(currentInput), disposition);

			return;
		}

		const { jumpTo } = await optionsStorage.getAll();
		openUrl(url + jumpTo, disposition);
	});

	browser.commands.onCommand.addListener(async command => {
		if (command !== 'refresh') {
			return;
		}

		await notify('⏳ Updating warp targets', 'This can take a while. Please wait a moment…');

		try {
			await updateGitHubStars();
			await updateGitHubRepos();
			await notify('✅ Update complete', 'The warp targets have been successfully updated.');
		} catch (error) {
			await notify('❌ An error occurred', errorToString(error));
		}
	});
})();
