import { openDB } from 'idb';

import { updateGitHubStars } from './github';

import type { GitHubRepo } from './github';
import type { DBSchema, IDBPDatabase } from 'idb';

const DB_VERSION = 17;

export interface TargetsDatabase extends DBSchema {
	starredGitHubRepos: {
		key: [GitHubRepo['owner'], GitHubRepo['name']];
		// eslint-disable-next-line id-denylist -- Name imposed by the base interface
		value: GitHubRepo;
		indexes: {
			starredAt: string;
		};
	};
}

export function getDatabase(): Promise<IDBPDatabase<TargetsDatabase>> {
	return openDB<TargetsDatabase>('targets', DB_VERSION, {
		upgrade(database) {
			if (database.objectStoreNames.contains('starredGitHubRepos')) {
				database.deleteObjectStore('starredGitHubRepos');
			}

			const store = database.createObjectStore('starredGitHubRepos', { keyPath: ['name', 'owner'] });
			store.createIndex('starredAt', 'starredAt');

			void updateGitHubStars();
		},
	});
}
