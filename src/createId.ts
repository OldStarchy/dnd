let createId: () => string;

if ('crypto' in globalThis && typeof crypto.randomUUID === 'function') {
	// crypto.randomUUID is available, use it directly
	createId = () => crypto.randomUUID();
} else {
	// crypto.randomUUID is not available, use a polyfill
	createId = function () {
		// Simple UUID v4 generator (not cryptographically secure)
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	};
}

export default createId;
