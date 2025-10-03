import useLocalStorage from './useLocalStorage';

declare global {
	interface LocalStorageKeys {
		'session-token': string;
	}
}

export function useSessionToken(): [
	string | null,
	(token: string | null) => void,
] {
	const [sessionToken, setSessionToken] = useLocalStorage(
		'session-token',
		(stored) => stored || null,
	);

	return [sessionToken, setSessionToken];
}
