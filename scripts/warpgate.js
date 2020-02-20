
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

"use strict";

(async function()
{
	/**
	 * Initialization
	 * ---------------------------------------------------------------------
	 */

	// Get the cached repo list
	let { repos } = await browser.storage.sync.get({ repos: [] });

	// Get the personal token of the user
	const token = (await browser.storage.sync.get({ githubPersonalToken: null })).githubPersonalToken;

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
		suggest(repos

			// Filter the suggested items based on the user's input
			.filter(repo => repo.name.toLowerCase().includes(text.toLowerCase()))

			// Make sure the list has always six items in it
			.slice(0, 6)

			// Create the suggestions list
			.map(repo => ({ description: repo.name, content: repo.url }))
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

	if (token)
	{
		// Update the list of repos if needed
		if (await isLocalRepoListOutdated(token, repos))
			repos = await getRemoteRepoList(token);
	}
})();
