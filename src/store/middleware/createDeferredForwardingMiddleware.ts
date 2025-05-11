import type { Middleware } from '@reduxjs/toolkit';

export function createDeferredForwardingMiddleware(
	predicate: (action: any) => boolean,
): { middleware: Middleware; setPort: (port: MessagePort | null) => void } {
	let port: MessagePort | null = null;

	const middleware: Middleware = () => (next) => (action) => {
		const result = next(action);

		if (port && predicate(action)) {
			port.postMessage({
				type: 'FORWARDED_ACTION',
				payload: action,
			});
		}

		return result;
	};

	return {
		middleware,
		setPort: (p) => {
			if (p) {
				port = p;
			} else {
				port = null;
			}
		},
	};
}
