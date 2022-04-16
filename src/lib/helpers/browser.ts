export const { version } = browser.runtime.getManifest();

export function notify(title: string, message: string): Promise<string> {
	// Firefox doesn't support notification.update yet https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/notifications/update#browser_compatibility
	return browser.notifications.create('warpgate-notification', { type: 'basic', title, message });
}

export function openUrl(url: string, disposition: browser.omnibox.OnInputEnteredDisposition): void {
	// eslint-disable-next-line default-case -- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/omnibox/OnInputEnteredDisposition
	switch (disposition) {
		case 'currentTab':
			browser.tabs.update({ url });
			break;

		case 'newForegroundTab':
			browser.tabs.create({ url });
			break;

		case 'newBackgroundTab':
			browser.tabs.create({ url, active: false });
			break;
	}
}
