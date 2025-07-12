import useLocalStorage from './useLocalStorage';

const DEFAULT_SERVER_URL = import.meta.env.VITE_DEFAULT_SERVER_URL || '';

export function useServerConfig(): [string, (url: string) => void] {
	const [serverUrl, setServerUrl] = useLocalStorage(
		'server-url',
		(stored) => stored || DEFAULT_SERVER_URL,
	);

	return [serverUrl, setServerUrl];
}
