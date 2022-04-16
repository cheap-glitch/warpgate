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

import { search } from './lib/search';
import { openUrl } from './lib/helpers/browser';
import { optionsStorage } from './lib/options-storage';
import { buildGitHubSearchUrl } from './lib/helpers/github';

browser.omnibox.setDefaultSuggestion({
	description: '🔍 Search on GitHub',
});

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

	const { jumpTo } = await optionsStorage.getAll();
	openUrl(url + jumpTo, disposition);
});
