export function buildGitHubSearchUrl(search: string): string {
	return 'https://github.com/search?q=' + encodeURIComponent(search);
}

export function buildGitHubRepoUrl(owner: string, repoName: string): string {
	return 'https://github.com/' + buildGitHubRepoID(owner, repoName);
}

export function buildGitHubRepoID(owner: string, repoName: string): string {
	return owner + '/' + repoName;
}
