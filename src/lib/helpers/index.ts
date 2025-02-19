import { version } from './browser';

export const userAgent = 'desktop:org.cheap-glitch:warpgate@' + version;

export function timeoutPromise<T>(duration: number, promise: Promise<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		const timeout = window.setTimeout(
			() => {
				reject(new Error('Timeout expired'));
			},
			duration,
		);

		(async () => {
			try {
				resolve(await promise);
			} catch (error) {
				reject(error);
			} finally {
				window.clearTimeout(timeout);
			}
		})();
	});
}

export function errorToString(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
