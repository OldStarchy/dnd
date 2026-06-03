type CreateUidFn = () => string;

const createUid: CreateUidFn = (() => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return () => crypto.randomUUID();
	}
	// Fallback implementation (not cryptographically secure)
	return () => {
		const randomPart = Math.random().toString(36).substring(2, 10);
		const timestampPart = Date.now().toString(36);
		return `${timestampPart}-${randomPart}`;
	};
})();

export default createUid;
