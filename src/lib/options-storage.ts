import OptionsSync from 'webext-options-sync';

import { getDatabase } from './database';

(async () => {
	const database = await getDatabase();
	console.log(await database.getAll('starredGitHubRepos'));
})();

const defaults = {
	personalToken: '',
	// SortBy: 'name',
	jumpTo: '',
};

const migrations = [
	OptionsSync.migrations.removeUnused,
];

export const optionsStorage = new OptionsSync({ defaults, migrations });
