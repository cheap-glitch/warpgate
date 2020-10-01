
/**                            _____  __
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

import { githubSettings  } from './constants.js'
import { getStorageValue } from './storage.js'
import { getGithubRepos  } from './github.js'

(async function()
{
	/**
	 * Initialization
	 * ---------------------------------------------------------------------
	 */

	// Initialize the list of all possible targets
	let targets = await generateTargets();

	// Set the message displayed at the top of the suggestions list
	browser.omnibox.setDefaultSuggestion({ description: "🚀💫 Warp in progress…" });

	/**
	 * UI callbacks
	 * ---------------------------------------------------------------------
	 */

	// Suggest URLs in the address bar
	browser.omnibox.onInputChanged.addListener(function(text, suggest)
	{
		if (!targets.length) return;

		// Split the user input to create a list of keywords
		const keywords = text.trim().toLowerCase().split(/\s+/);

		suggest(targets

			// Filter the suggested targets based on the user's input
			.filter(target => keywords.every(keyword => target.description.toLowerCase().includes(keyword)))

			// Make sure the list doesn't have more than six suggestions in it
			.slice(0, 6)
		);
	});

	// Perform the correct action when a suggestion is selected by the user
	browser.omnibox.onInputEntered.addListener(function(url, disposition)
	{
		// Ignore the first suggestion (the info message)
		if (!url.startsWith('https://')) return;

		// Open the URL according to the user's choice
		switch (disposition)
		{
			case 'currentTab':       browser.tabs.update({ url });                break;
			case 'newForegroundTab': browser.tabs.create({ url });                break;
			case 'newBackgroundTab': browser.tabs.create({ url, active: false }); break;
		}
	});

	/**
	 * Data refreshing
	 * ---------------------------------------------------------------------
	 */

	// Force a refresh of the local data when the corresponding keyboard command is sent
	browser.commands.onCommand.addListener(async function(command)
	{
		if (command == 'refresh-data')
		{
			await browser.notifications.create('notif-data-refreshed', {
				type:    'basic',
				title:   'Updating warp targets ⌛',
				message: 'Please wait a moment...'
			})

			targets = await generateTargets();

			await browser.notifications.create('notif-data-refreshed', {
				type:    'basic',
				title:   'Warp targets updated! 👍',
				message: 'The warp targets have been successfully updated.'
			})
		}
	});

	// Refresh the local data every 10 minutes
	window.setInterval(async () => targets = await generateTargets(), 10*60*1000);

	// Refresh the data when an option is modified
	browser.runtime.onMessage.addListener(async function(message)
	{
		if (message == 'refresh-data')
			targets = await generateTargets();
	});
})();

/**
 * Generate a list of targets for the address bar
 */
async function generateTargets()
{
	let targets = [];

	console.info('Generating new targets...');

	/**
	 * GitHub
	 */
	const token        = await getStorageValue('sync', 'github:token',        null,                           v => typeof v == 'string');
	const sortByName   = await getStorageValue('sync', 'github:sortByName',   githubSettings['sortByName'],   v => typeof v == 'boolean');
	const fullRepoName = await getStorageValue('sync', 'github:fullRepoName', githubSettings['fullRepoName'], v => typeof v == 'boolean');
	const jumpToReadme = await getStorageValue('sync', 'github:jumpToReadme', githubSettings['jumpToReadme'], v => typeof v == 'boolean');

	let repos = await getGithubRepos(token);
	if (sortByName)
	{
		// Create a collator to compare strings speedily
		const coll = new Intl.Collator('en');

		repos.sort((a, b) => coll.compare(a.node.nameWithOwner.split('/')[1], b.node.nameWithOwner.split('/')[1]));
	}

	targets.push.apply(targets, repos.map(repo => ({
		content:     repo.node.url + (jumpToReadme ? '#readme' : ''),
		description: fullRepoName ? repo.node.nameWithOwner : repo.node.nameWithOwner.split('/')[1],
	})));

	console.info('Generated new targets:', targets);

	return targets;
}
