import { BackendApi } from '@/sync/BackendApi';
import { createContext, useContext } from 'react';

const BackendApiContext = createContext<BackendApi | null>(null);

export function useBackendApi(): BackendApi {
	const api = useContext(BackendApiContext);
	if (!api) {
		throw new Error(
			'useBackendApi must be used within a BackendApiProvider',
		);
	}
	return api;
}

export const BackendApiProvider = BackendApiContext.Provider;
