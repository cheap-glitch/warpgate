
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
 *
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either  version 3 of the  License, or (at your  option) any later
 * version.
 *
 * This program is distributed  in the hope that it will  be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR  A PARTICULAR  PURPOSE.  See  the GNU  General  Public  License for  more
 * details.
 *
 * You should have received a copy of  the GNU General Public License along with
 * this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { getStorageValue, setStorageValue           } from './storage.js'
import { getRemoteRepoList, isLocalRepoListOutdated } from './github.js'

(async function()
{
	/**
	 * Initialization
	 * ---------------------------------------------------------------------
	 */

	let   githubRepos          = await getStorageValue('githubRepos',          [],              v => Array.isArray(v));
	const githubToken          = await getStorageValue('githubPersonalToken',  null,            v => typeof v == 'string');
	const githubSearchRepoName = await getStorageValue('githubSearchRepoName', 'nameWithOwner', v => ['nameWithOwner', 'nameOnly'].includes(v));

	// Set the message displayed at the top of the suggestions list
	browser.omnibox.setDefaultSuggestion({ description: "🚀💫 Preparing for warp…" });

	/**
	 * UI callbacks
	 * ---------------------------------------------------------------------
	 */

	// Suggest the most visited repos when the keyword is entered in the address bar
	// @TODO

	// Suggest URLs in the address bar
	browser.omnibox.onInputChanged.addListener(function(text, suggest)
	{
		if (!githubRepos.length) return;

		suggest(githubRepos

			// Build the list of suggestions
			.map(repo => ({ description: githubSearchRepoName == 'nameOnly' ? repo.name.split('/')[1] : repo.name, content: repo.url }))

			// Filter the suggested items based on the user's input
			.filter(repo => repo.description.toLowerCase().includes(text.toLowerCase()))

			// Make sure the list doesn't have more than six items in it
			.slice(0, 6)
		);
	});

	// Perform the correct action when a suggestion is selected by the user
	browser.omnibox.onInputEntered.addListener(function(url, disposition)
	{
		// Ignore the first suggestion (info message)
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

	async function updateRepoList()
	{
		// Update the list of repos if needed
		if (await isLocalRepoListOutdated(githubToken, githubRepos))
		{
			githubRepos = await getRemoteRepoList(githubToken);
			await setStorageValue('githubRepos', githubRepos);
		}
	}

	// Force a refresh of the data when the corresponding keyboard command is sent
	browser.commands.onCommand.addListener(async function(command)
	{
		if (command != 'refresh-data') return;

		// Update the data & send a notification to alert the user
		await updateRepoList();
		await browser.notifications.create('notif-data-refreshed', {
			type:     'basic',
			title:    'Warp targets updated! 👍',
			message:  'The warp targets have been successfully updated.'
		})
	});

	// Refresh the local data every 10 minutes
	if (githubToken)
	{
		await updateRepoList();
		window.setInterval(updateRepoList, 10*60*1000);
	}
})();
