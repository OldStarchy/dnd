import { BackendApiContext } from '@/context/BackendApiContext';
import { BackendApi } from '@/sync/BackendApi';
import { useContext } from 'react';

export function useBackendApi(): BackendApi {
	const api = useContext(BackendApiContext);
	if (!api) {
		throw new Error(
			'useBackendApi must be used within a BackendApiProvider',
		);
	}
	return api;
}
