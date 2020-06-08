
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

	// Suggest the most visited URLs when the keyword is entered in the address bar
	// @TODO

	// Suggest URLs in the address bar
	browser.omnibox.onInputChanged.addListener(function(text, suggest)
	{
		if (!targets.length) return;

		suggest(targets

			// Filter the suggested targets based on the user's input
			.filter(target => target.description.toLowerCase().includes(text.trim().toLowerCase()))

			// Make sure the list doesn't have more than six suggestions in it
			.slice(0, 6)
		);
	});

	// Perform the correct action when a suggestion is selected by the user
	browser.omnibox.onInputEntered.addListener(function(url, disposition)
	{
		// Ignore the first suggestion (the info message)
		if (!url.startsWith('https://')) return;

		switch (disposition)
		{
			case 'currentTab':
				browser.tabs.update({ url });
				break;

			case 'newForegroundTab':
				browser.tabs.create({ url });
				break;

			case 'newBackgroundTab':
				browser.tabs.create({ url, active: false });
				break;
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
			targets = await generateTargets();

			await browser.notifications.create('notif-data-refreshed', {
				type:     'basic',
				title:    'Warp targets updated! 👍',
				message:  'The warp targets have been successfully updated.'
			})
		}
	});

	// Refresh the local data every 10 minutes
	window.setInterval(async () => targets = await generateTargets(), 10*60*1000);

	// Refresh the data when an option is modified
	browser.runtime.onMessage.addListener(async function(message, _, sendResponse)
	{
		if (message != '[options.js][update targets]') return;

		targets = await generateTargets();

		await (new Promise(resolve => setTimeout(resolve, 800)));
		sendResponse('[warpgate.js][targets updated]');
	});
})();

/**
 * Helpers
 * =====================================================================
 */

async function generateTargets()
{
	const sources = {
		github: {
			token:          await getStorageValue('githubPersonalToken',  null,            v => typeof v == 'string'),
			searchRepoName: await getStorageValue('githubSearchRepoName', 'nameWithOwner', v => ['nameWithOwner', 'nameOnly'].includes(v)),
		},

		reddit: {
		},

		twitter: {
		},
	};

	let targets = [];
	for (const [source, settings] of Object.entries(sources))
	{
		switch (source)
		{
			/**
			 * GitHub starred repos
			 */
			case 'github':
				targets = [
					...targets,
					...(await getGithubRepos(settings.token)).map(repo => ({
						content:     repo.url,
						description: settings.searchRepoName == 'nameOnly'
							     ? repo.name.split('/')[1]
							     : repo.name,
					}))
				];
				break;
		}
	}

	return targets;
}
