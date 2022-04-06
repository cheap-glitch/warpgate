import { version } from './helpers/browser';
import { getDatabase } from './database';
import { timeoutPromise } from './helpers';
import { optionsStorage } from './options-storage';

export interface GitHubRepo {
	readonly name: string;
	readonly owner: string;
}

export async function updateGitHubStars(): Promise<void> {
	const { personalToken } = await optionsStorage.getAll();
	if (await isLocalRepoListOutdated(personalToken)) {
		return downloadAllStarredGitHubRepos(personalToken);
	}
}

async function downloadAllStarredGitHubRepos(personalToken: string): Promise<void> {
	const repos: GitHubRepo[] = [];

	let cursor = 'null';
	let hasNextPage = true;
	try {
		while (hasNextPage) {
			const { starredRepositories } = await queryGitHubApi(personalToken, `
				starredRepositories(
					first: 100,
					after: ${cursor},
					orderBy: { field: STARRED_AT, direction: DESC },
				) {
					nodes {
						name
						owner { login }
					}
					pageInfo {
						endCursor
						hasNextPage
					}
				}
			`);

			// eslint-disable-next-line @typescript-eslint/no-shadow -- Rule bug?
			for (const { name, owner } of starredRepositories.nodes) {
				repos.push({ name, owner: owner.login });
			}

			cursor = JSON.stringify(starredRepositories.pageInfo.endCursor);
			hasNextPage = starredRepositories.pageInfo.hasNextPage;
		}
	} catch (error) {
		console.error(error);

		// Preserve the local data in case of API failure
		return;
	}

	if (repos.length === 0) {
		return;
	}

	const database = await getDatabase();
	const transaction = database.transaction('starredGitHubRepos', 'readwrite');

	await Promise.all([
		transaction.store.clear(),
		...repos.map(repo => transaction.store.add(repo)),
		transaction.done,
	]);

	await browser.storage.local.set({
		lastStarredRepo: repos[0],
	});
}

// Return `true` iff the number of starred repos or the name of the last starred repo has changed
async function isLocalRepoListOutdated(personalToken: string): Promise<boolean> {
	let starredRepositoriesCount: number;
	let lastStarredRepo: GitHubRepo;

	try {
		const { starredRepositories } = await queryGitHubApi(personalToken, `
			starredRepositories(first: 1, orderBy: { field: STARRED_AT, direction: DESC }) {
				totalCount
				nodes {
					name
					owner { login }
				}
			}
		`);

		starredRepositoriesCount = starredRepositories.totalCount;
		lastStarredRepo = {
			name: starredRepositories.nodes[0].name,
			owner: starredRepositories.nodes[0].owner.login,
		};
	} catch (error) {
		console.error(error);

		// If the GitHub API couldn't be reached, keep the local data
		return false;
	}

	try {
		const database = await getDatabase();
		if (await database.count('starredGitHubRepos') !== starredRepositoriesCount) {
			return true;
		}

		const repo = await browser.storage.local.get('lastStarredRepo');
		if (!repo) {
			return true;
		}

		return repo.name !== lastStarredRepo.name || repo.owner !== lastStarredRepo.owner;
	} catch {
		return false;
	}
}

const FETCH_TIMEOUT = 6000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Needed to store the API response
type AnyObject = Record<string, any>;

async function queryGitHubApi(personalToken: string, viewerQuery: string): Promise<AnyObject> {
	const response = await timeoutPromise(FETCH_TIMEOUT, fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: {
			'User-Agent': `desktop:org.cheap-glitch:warpgate@${version}`,
			'Content-Type': 'application/json',
			'Authorization': `bearer ${personalToken}`,
		},
		body: JSON.stringify({
			query: `
				query {
					viewer {
						${viewerQuery}
					}
				}
			`,
		}),
	}));

	if (!response.ok) {
		throw new Error(String(response));
	}

	const { data } = await response.json();

	return data?.viewer ?? {};
}
