import { getDatabase } from './database';
import { buildGitHubRepoUrl } from './helpers/github';

// The "omnibox" can only display up to six suggestions https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/omnibox/onInputChanged#parameters
const MAX_SEARCH_RESULTS = 6;

// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/omnibox/SuggestResult
export interface SearchResult {
	readonly content: string;
	readonly description: string;
}

export async function search(input: string): Promise<SearchResult[]> {
	const results: SearchResult[] = [];
	const keywords = input
		.trim()
		.toLowerCase()
		.split(/[\s-]+/u);

	const database = await getDatabase();
	const index = database
		.transaction('starredGitHubRepos')
		.store
		.index('name');

	for await (const cursor of index.iterate()) {
		if (keywords.some(keyword => cursor.key.includes(keyword))) {
			results.push({
				content: buildGitHubRepoUrl(cursor.value.owner, cursor.value.name),
				description: cursor.value.name,
			});
		}

		if (results.length >= MAX_SEARCH_RESULTS) {
			break;
		}
	}

	return results;
}
