import { getGitHubRepoSuggestion } from './helpers/github';

import type { GitHubRepo } from './github';

// The "omnibox" can only display up to six suggestions https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/omnibox/onInputChanged#parameters
const OMNIBOX_MAX_ITEM_COUNT = 6;

// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/omnibox/SuggestResult
export interface SearchResult extends browser.omnibox.SuggestResult {
	score: number;
}

export function searchGitHubRepos(repos: GitHubRepo[], input: string): browser.omnibox.SuggestResult[] {
	const keywords = input
		.trim()
		.toLowerCase()
		.split(/[\s-]+/u);

	const results: SearchResult[] = [];
	const maxResultCount = Math.max(Math.trunc(repos.length / 200), OMNIBOX_MAX_ITEM_COUNT);

	for (const repo of repos) {
		if (results.length === maxResultCount) {
			break;
		}

		if (!keywords.every(keyword => repo.name.includes(keyword))) {
			continue;
		}

		const score = getResultScore(repo.name, keywords);

		if (results.length === 0 || score >= results[results.length - 1].score && results.length < maxResultCount) {
			results.push(getGitHubRepoResult(repo, score));
			continue;
		}

		const firstWorseResultIndex = results.findIndex(result => score < result.score);
		if (firstWorseResultIndex !== -1) {
			results.splice(firstWorseResultIndex, 0, getGitHubRepoResult(repo, score));
		}
	}

	return results;
}

function getGitHubRepoResult(repo: GitHubRepo, score: number): SearchResult {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TypeScript won't let the type be augmented otherwise
	const suggestion: any = getGitHubRepoSuggestion(repo);
	suggestion.score = score;

	return suggestion as SearchResult;
}

function getResultScore(result: string, keywords: string[]): number {
	// Lower is better. Prioritize shorter results where keywords are closer to the beginning
	return keywords.reduce((sum, keyword) => sum + result.indexOf(keyword), 0) + result.length;
}
