import OptionsSync from 'webext-options-sync';

import type { Options as WebextOptions } from 'webext-options-sync';

interface Options extends WebextOptions {
	personalToken: string;
	sortBy: 'name' | 'starredAt';
	jumpTo: '' | '#readme' | '/issues';
}

const defaults: Options = {
	personalToken: '',
	sortBy: 'name',
	jumpTo: '',
};

const migrations = [
	OptionsSync.migrations.removeUnused,
];

export const optionsStorage = new OptionsSync({ defaults, migrations });
