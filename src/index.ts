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

import { getGitHubRepos } from './lib/github';
import { getStorageValue } from './lib/storage';
import { defaultGitHubSettings } from './lib/defaults';

(async () => {
	// Initialize the list of all possible targets
	let targets = await generateTargets();

	// Set the message displayed at the top of the suggestions list
	browser.omnibox.setDefaultSuggestion({ description: '🚀💫 Warp in progress…' });

	// Suggest URLs in the address bar
	browser.omnibox.onInputChanged.addListener((text, suggest) => {
		if (targets.length === 0) {
			return;
		}

		// Split the user input to create a list of keywords
		const keywords = text.trim().toLowerCase().split(/\s+/u);

		suggest(targets
			// Filter the suggested targets based on the user's input
			.filter(target => keywords.every(keyword => target.description.toLowerCase().includes(keyword)))
			// Make sure the list doesn't have more than six suggestions in it
			.slice(0, 6),
		);
	});

	// Perform the correct action when a suggestion is selected by the user
	browser.omnibox.onInputEntered.addListener((url, disposition) => {
		// Ignore the first suggestion (the info message)
		if (!url.startsWith('https://')) {
			return;
		}

		// Open the URL according to the user's choice
		switch (disposition) {
			case 'currentTab':
				browser.tabs.update({ url });
				break;
			case 'newForegroundTab':
				browser.tabs.create({ url });
				break;
			case 'newBackgroundTab':
				browser.tabs.create({ url, active: false });
				break;
			default:
				throw new Error(`Unsupported tab disposition setting "${disposition}"`);
		}
	});

	// Force a refresh of the local data when the corresponding keyboard command is sent
	browser.commands.onCommand.addListener(async command => {
		if (command === 'refresh-data') {
			await browser.notifications.create('notif-data-refreshed', {
				type: 'basic',
				title: 'Updating warp targets ⌛',
				message: 'Please wait a moment...',
			});

			targets = await generateTargets();

			await browser.notifications.create('notif-data-refreshed', {
				type: 'basic',
				title: 'Warp targets updated! 👍',
				message: 'The warp targets have been successfully updated.',
			});
		}
	});

	// Refresh the local data every 10 minutes
	window.setInterval(
		async () => {
			targets = await generateTargets();
		},
		10 * 60 * 1000,
	);

	// Refresh the data when an option is modified
	browser.runtime.onMessage.addListener(async message => {
		if (message === 'refresh-data') {
			targets = await generateTargets();
		}
	});
})();

interface WarpTarget {
	content: string;
	description: string;
}

async function generateTargets(): Promise<WarpTarget[]> {
	const targets: WarpTarget[] = [];
	console.log('Generating new targets...');

	const token: string | undefined = await getStorageValue('sync', 'github:token');
	const sortByName = await getStorageValue('sync', 'github:sortByName') ?? defaultGitHubSettings.sortByName;
	const fullRepoName = await getStorageValue('sync', 'github:fullRepoName') ?? defaultGitHubSettings.fullRepoName;
	const jumpToReadme = await getStorageValue('sync', 'github:jumpToReadme') ?? defaultGitHubSettings.jumpToReadme;

	const repos = await getGitHubRepos(token);
	if (sortByName) {
		const collator = new Intl.Collator('en');
		repos.sort((a, b) => collator.compare(
			a.nameWithOwner.split('/')[1],
			b.nameWithOwner.split('/')[1],
		));
	}

	for (const repo of repos) {
		targets.push({
			content: repo.url + (jumpToReadme ? '#readme' : ''),
			description: fullRepoName ? repo.nameWithOwner : repo.nameWithOwner.split('/')[1],
		});
	}
	console.log('Generated new targets:', targets);

	return targets;
}
