/*
 *                             _____  __
 *  _    _____ ________  ___ _/ ___ \/ /____
 * | |/|/ / _ `/ __/ _ \/ _ `/ / _ `/ __/ -_)
 * |__,__/\_,_/_/ / .__/\_, /\ \_,_/\__/\__/
 *               /_/   /___/  \___/
 *
 * A lightweight browser extension to jump to various external bookmarks via the
 * address bar.
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

let currentInput = '';
browser.omnibox.onInputChanged.addListener(async (input, suggest) => {
	currentInput = input;
	suggest(await search(input));
});

browser.omnibox.onInputEntered.addListener(async (url, disposition) => {
	if (!url.startsWith('https://')) {
		// If the first "suggestion" is selected, perform a search on GitHub
		openUrl(buildGitHubSearchUrl(currentInput), disposition);

		return;
	}

	const { jumpTo } = await optionsStorage.getAll();
	openUrl(url + jumpTo, disposition);
});
