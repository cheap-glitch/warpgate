import { FETCH_TIMEOUT } from './constants.js';
import { getStorageValue, setStorageValue } from './storage.js';

/**
 * Return the list of repos, updated if necessary
 */
export async function getGithubRepos(token) {
	let repos = await getStorageValue('local', 'github:repos', []);
	console.log('Updating GitHub repos:', repos);

	if (!token) {
		console.error('No token found for the GitHub API!');
		return repos;
	}

	// Update the list of repos if needed
	if (await isLocalRepoListOutdated(token, repos)) {
		repos = await getStarredReposList(token);
		await setStorageValue('local', 'github:repos', repos);
	}

	return repos;
}

/**
 * Check for changes in the list of starred repos
 */
async function isLocalRepoListOutdated(token, repos) {
	console.log('Checking for outdated repos list...');

	// Fetch the number of starred repos and the URL of the last starred repo the GitHub API
	const data = await queryAPI(token, `
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
		console.error('Failed to query GitHub API!');
		return false;
	}

	const { starredRepositories } = data.viewer;

	// Return true if the number of starred repos has changed, or if the latest repo isn't the same
	return repos.length !== starredRepositories.totalCount || repos[0].node.url !== starredRepositories.edges[0].node.url;
}

/**
 * Fetch the full list of starred repos from the GitHub API
 */
async function getStarredReposList(token) {
	console.log('Fetching new repos list...');

	let data;
	let pageInfo;
	let endCursor;
	const repos = [];

	// Loop through the pages until the last one is reached
	do {
		data = await queryAPI(token, `
			viewer {
			    starredRepositories(${endCursor ? `after: "${endCursor}",` : ''} first: 100, orderBy: { field: STARRED_AT, direction: DESC }) {
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
		repos.push(data.viewer.starredRepositories.edges);

		pageInfo = data.viewer.starredRepositories.pageInfo;
		endCursor = pageInfo.endCursor;
	} while (pageInfo.hasNextPage);

	return repos;
}

/**
 * Query the GitHub v4 GraphQL API and return the resulting JSON
 */
async function queryAPI(token, query) {
	let response;
	let responseJson;

	// Query the API
	try {
		response = await timeoutPromise(FETCH_TIMEOUT, fetch('https://api.github.com/graphql', {
			body: `{ "query": "query {${query.replaceAll('"', '\\"').replace(/\n|\t/ug, ' ').replace(/ {2,}/ug, ' ')}}" }`,
			method: 'POST',
			headers: {
				'User-Agent': 'desktop:org.cheap-glitch@warpgate:v1.2.0',
				'Content-Type': 'application/json',
				'Authorization': `bearer ${token}`,
			},
		}));
	} catch (error) {
		console.error(error);
		return;
	}

	// Extract the JSON data from the body of the response
	try {
		responseJson = await response.json();
	} catch (error) {
		console.error(error);
		return;
	}

	return responseJson.data;
}

/**
 * Wrap a promise in another that will be reject once the timeout expires
 */
function timeoutPromise(duration, promise) {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(
			() => {
				reject(new Error('Timeout expired'));
			},
			duration,
		);

		promise.then(
			response => {
				clearTimeout(timeout);
				resolve(response);
			},
			error => {
				clearTimeout(timeout);
				reject(error);
			},
		);
	});
}
