
/**
 * scripts/github.js
 */

"use strict";

/**
 * Fetch the full list of starred repos from the GitHub API
 */
async function getRemoteRepoList(token)
{
	let repos     = [];
	let data      = null;
	let endCursor = null;

	// Loop through the pages until the last one is reached
	do {
		data = await queryGitHubAPI(token, `
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

	// Update the local data
	await browser.storage.sync.set({ repos });

	return repos;
}

/**
 * Check for changes in the list of starred repos
 */
async function isLocalRepoListOutdated(token, repos)
{
	// Fetch the number of starred repos and the URL of the last starred repo the GitHub API
	const data = await queryGitHubAPI(token, `
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
 * Query the GitHub v4 GraphQL API and return the resulting JSON
 */
async function queryGitHubAPI(token, query)
{
	let res = null;

	try {
		res = await fetch('https://api.github.com/graphql', {
			method:  'POST',
			body:    `{ "query": "query {${query.replace(/"/g, '\\"').replace(/\n|\t/g, ' ').replace(/ {2,}/g, ' ')}}" }`,
			headers: {
				'Content-Type':   'application/json',
				'Authorization':  `bearer ${token}`,
			},
		});
	}
	catch (err) {
		return null;
	}

	return (await res.json()).data;
}
