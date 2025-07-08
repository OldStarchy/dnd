import useLocalStorage from './useLocalStorage';

const DEFAULT_SERVER_URL = '';

export function useServerConfig(): [string, (url: string) => void] {
	const [serverUrl, setServerUrl] = useLocalStorage(
		'server-url',
		(stored) => stored || DEFAULT_SERVER_URL,
	);

	const updateServerUrl = (url: string) => {
		setServerUrl(url);
	};

	return [serverUrl, updateServerUrl];
}
