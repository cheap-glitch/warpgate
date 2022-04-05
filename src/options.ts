import { optionsStorage } from './options-storage';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Select the form in options.html
optionsStorage.syncForm(document.querySelector('form')!);

optionsStorage.syncForm(optionsForm);
optionsForm.addEventListener('options-sync:form-synced', sendUpdateMessage);

function sendUpdateMessage(): Promise<void> {
	return browser.runtime.sendMessage('updateWarpTargets');
}
