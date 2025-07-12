import useLocalStorage from './useLocalStorage';

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
