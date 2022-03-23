import { FETCH_TIMEOUT } from './defaults';
import { getStorageValue, setStorageValue } from './storage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Needed to store the API response
export type AnyObject = Record<string, any>;

export interface GitHubRepo {
	nameWithOwner: string;
	url: string;
}

// Return the list of repos, updated if necessary
export async function getGitHubRepos(token: string | undefined): Promise<GitHubRepo[]> {
	let repos: GitHubRepo[] = await getStorageValue('local', 'github:repos') ?? [];
	console.log('Updating GitHub repos:', repos);

	if (!token) {
		console.error('No token found for the GitHub API');

		return repos;
	}

	if (await isLocalRepoListOutdated(token, repos)) {
		repos = await getStarredReposList(token);
		await setStorageValue('local', 'github:repos', repos);
	}

	return repos;
}

async function isLocalRepoListOutdated(token: string, repos: GitHubRepo[]): Promise<boolean> {
	console.log('Checking for outdated repos list...');

	// Fetch the number of starred repos and the URL of the last starred repo
	const data = await queryGitHubApi(token, `
		viewer {
		    starredRepositories(first: 1, orderBy: { field: STARRED_AT, direction: DESC }) {
		        totalCount
		        edges {
		            node {
		                url
		            }
		        }
		    }
		}
	`);

	if (!data) {
		// If the GitHub API couldn't be reached, keep the local data
		console.error('Failed to query GitHub API');

		return false;
	}

	const { starredRepositories: starredRepos } = data.viewer;

	// Return `true` if the number of starred repos has changed or if the latest repo isn't the same
	return repos.length !== starredRepos.totalCount || repos[0].url !== starredRepos.edges[0].node.url;
}

async function getStarredReposList(token: string): Promise<GitHubRepo[]> {
	console.log('Fetching new repos list...');

	let pageInfo;
	let endCursor;

	const repos = [];
	do {
		const data: AnyObject | undefined = await queryGitHubApi(token, `
			viewer {
			    starredRepositories(
			        after: ${endCursor ? `"${endCursor}"` : 'null'},
			        first: 100,
			        orderBy: { field: STARRED_AT, direction: DESC },
			    ) {
			        edges {
			            node {
			                nameWithOwner
			                url
			            }
			        }
			        pageInfo {
			            endCursor
			            hasNextPage
			        }
			    }
			}
		`);

		if (!data) {
			console.error('Failed to query GitHub API');

			return repos;
		}

		console.log('Successfully queried GitHub API:', data);
		for (const edge of data.viewer.starredRepositories.edges) {
			repos.push(edge.node);
		}

		pageInfo = data.viewer.starredRepositories.pageInfo;
		endCursor = pageInfo.endCursor;
	} while (pageInfo.hasNextPage);

	return repos;
}

async function queryGitHubApi(token: string, query: string): Promise<AnyObject | undefined> {
	let response;
	let responseJson;

	try {
		response = await timeoutPromise(FETCH_TIMEOUT, fetch('https://api.github.com/graphql', {
			method: 'POST',
			body: JSON.stringify({
				query: `query { ${query} }`,
			}),
			headers: {
				// TODO: Get version number from manifest
				'User-Agent': 'desktop:org.cheap-glitch:warpgate@1.2.0',
				'Content-Type': 'application/json',
				'Authorization': `bearer ${token}`,
			},
		}));
	} catch (error) {
		console.error(error);

		return;
	}

	if (!response.ok) {
		console.error(response);

		return;
	}

	try {
		responseJson = await response.json();
	} catch (error) {
		console.error(error);

		return;
	}

	return responseJson.data;
}

function timeoutPromise<T>(duration: number, promise: Promise<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		const timeout = window.setTimeout(
			() => {
				reject(new Error('Timeout expired'));
			},
			duration,
		);

		(async () => {
			try {
				resolve(await promise);
			} catch (error) {
				reject(error);
			} finally {
				window.clearTimeout(timeout);
			}
		})();
	});
}
