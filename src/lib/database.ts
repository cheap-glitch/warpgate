import { openDB } from 'idb/with-async-ittr';

import type { GitHubRepo } from './github';
import type { DBSchema, IDBPDatabase } from 'idb/with-async-ittr';

const DB_VERSION = 10;

export interface TargetsDatabase extends DBSchema {
	starredGitHubRepos: {
		key: GitHubRepo['name'];
		// eslint-disable-next-line id-denylist -- Name imposed by the base interface
		value: GitHubRepo;
		indexes: {
			name: string;
		};
	};
}

export function getDatabase(): Promise<IDBPDatabase<TargetsDatabase>> {
	return openDB<TargetsDatabase>('targets', DB_VERSION, {
		upgrade(database) {
			database.deleteObjectStore('starredGitHubRepos');
			const store = database.createObjectStore('starredGitHubRepos', { keyPath: ['owner', 'name'] });
			store.createIndex('name', 'name');
		},
	});
}
