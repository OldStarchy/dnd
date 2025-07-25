import useLocalStorage from './useLocalStorage';

const DEFAULT_SERVER_URL = (import.meta.env.VITE_BASE_URL || '').replace(
	/\/+$/,
	'',
);

export function useServerConfig(): [string, (url: string) => void] {
	const [serverUrl, setServerUrl] = useLocalStorage(
		'server-url',
		(stored) => stored || DEFAULT_SERVER_URL,
	);

	return [serverUrl, setServerUrl];
}
