
/**
 * scripts/github.js
 */

import { getStorageValue, setStorageValue } from './storage.js'

/**
 * Return the list of repos, updated if necessary
 */
export async function getGithubRepos(token)
{
	if (!token) return [];

	let repos = await getStorageValue('githubRepos', [], v => Array.isArray(v));

	// Update the list of repos if needed
	if (token && await isLocalRepoListOutdated(token, repos))
	{
		repos = await getStarredReposList(token);
		await setStorageValue('githubRepos', repos);
	}

	return repos;
}

/**
 * Check for changes in the list of starred repos
 */
async function isLocalRepoListOutdated(token, repos)
{
	// Fetch the number of starred repos and the URL of the last starred repo the GitHub API
	const data = await queryAPI(token, `
		viewer {
		    starredRepositories(first: 1, orderBy: { field: STARRED_AT, direction: DESC }) {
		        totalCount
		        edges {
		            node { url }
		        }
		    }
		}
	`);

	return !data
	    || repos.length != data.viewer.starredRepositories.totalCount
	    || repos[0].url != data.viewer.starredRepositories.edges[0].node.url;
}

/**
 * Fetch the full list of starred repos from the GitHub API
 */
async function getStarredReposList(token)
{
	let repos     = [];
	let data      = null;
	let endCursor = null;

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

		if (!data) return;

		repos     = [...repos, ...data.viewer.starredRepositories.edges.map(edge => ({ name: edge.node.nameWithOwner, url: edge.node.url }))];
		endCursor = data.viewer.starredRepositories.pageInfo.endCursor;

	} while(data.viewer.starredRepositories.pageInfo.hasNextPage);

	return repos;
}

/**
 * Query the GitHub v4 GraphQL API and return the resulting JSON
 */
async function queryAPI(token, query)
{
	let res  = null;
	let json = null;

	// Query the API
	try {
		res = await fetch('https://api.github.com/graphql', {
			method:  'POST',
			body:    `{ "query": "query {${query.replace(/"/g, '\\"').replace(/\n|\t/g, ' ').replace(/ {2,}/g, ' ')}}" }`,
			headers: {
				'User-Agent':     'desktop:org.cheap-glitch@warpgate:v0.0.1',
				'Authorization':  `bearer ${token}`,
				'Content-Type':   'application/json',
			},
		});
	}
	catch (err) {
		console.error(err);

		return null;
	}

	// Extract the JSON data from the body of the response
	try {
		json = await res.json();
	}
	catch (err) {
		console.error(err);

		return null;
	}

	return json.data;
}
