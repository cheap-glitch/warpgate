import type { GitHubRepo } from '../github';

export function getGitHubSearchUrl(search: string): string {
	return 'https://github.com/search?q=' + encodeURIComponent(search);
}

export function getGitHubRepoSuggestion(repo: GitHubRepo): browser.omnibox.SuggestResult {
	return {
		content: getGitHubRepoUrl(repo),
		description: repo.name,
	};
}

function getGitHubRepoUrl(repo: GitHubRepo): string {
	return 'https://github.com/' + getGitHubRepoID(repo);
}

function getGitHubRepoID({ owner, name: repoName }: GitHubRepo): string {
	return owner + '/' + repoName;
}
