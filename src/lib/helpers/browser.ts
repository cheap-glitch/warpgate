export const { version } = browser.runtime.getManifest();

type MessageId = 'updateTargets';

type NotificationId = 'targetsUpdate' | 'error';

export async function notify(id: NotificationId, title: string, message: string): Promise<void> {
	if (await browser.notifications.update(id, { type: 'basic', title, message })) {
		// The notification already exists and was succesfully updated
		return;
	}

	await browser.notifications.create(id, { type: 'basic', title, message });
}

export function sendMessage(message: MessageId): Promise<void> {
	return browser.runtime.sendMessage(message);
}

export function setupMessageListeners(callbacks: Record<MessageId, () => Promise<void>>): void {
	browser.runtime.onMessage.addListener((message: MessageId) => {
		for (const [callbackMessage, callback] of Object.entries(callbacks)) {
			if (message === callbackMessage) {
				void callback();
			}
		}
	});
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
