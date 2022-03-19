/**
 *                            _____  __
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

import { githubSettings } from './constants.js';
import { getGithubRepos } from './github.js';
import { getStorageValue } from './storage.js';

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

/**
 * Generate a list of targets for the address bar
 */
async function generateTargets() {
	const targets = [];
	console.log('Generating new targets...');

	const token = await getStorageValue('sync', 'github:token');
	const sortByName = await getStorageValue('sync', 'github:sortByName', githubSettings.sortByName);
	const fullRepoName = await getStorageValue('sync', 'github:fullRepoName', githubSettings.fullRepoName);
	const jumpToReadme = await getStorageValue('sync', 'github:jumpToReadme', githubSettings.jumpToReadme);

	const repos = await getGithubRepos(token);
	if (sortByName) {
		const collator = new Intl.Collator('en');
		repos.sort((a, b) => collator.compare(
			a.node.nameWithOwner.split('/')[1],
			b.node.nameWithOwner.split('/')[1],
		));
	}

	// TODO [>=1.1.0]: Fix this

	for (const repo of repos) {
		targets.push({
			content: repo.node.url + (jumpToReadme ? '#readme' : ''),
			description: fullRepoName ? repo.node.nameWithOwner : repo.node.nameWithOwner.split('/')[1],
		});
	}

	console.log('Generated new targets:', targets);

	return targets;
}
