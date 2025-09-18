import { LOCAL_STORAGE_NAMESPACE } from '@/const';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import { useLocalConfig } from './useLocalConfig';

describe('useServerConfig', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('returns empty string as default server URL', () => {
		const { result } = renderHook(() => useLocalConfig());

		expect(result.current[0].hostUrl).toBe('');
	});

	it('updates and persists server URL', () => {
		const { result, act } = renderHook(() => useLocalConfig());

		act(() => {
			result.current[1]({ hostUrl: 'https://test-server.com' });
		});

		expect(result.current[0].hostUrl).toEqual('https://test-server.com');
		expect(
			JSON.parse(
				localStorage.getItem(
					LOCAL_STORAGE_NAMESPACE + ':localConfig',
				) ?? '',
			).hostUrl,
		).toBe('https://test-server.com');
	});

	it('loads server URL from localStorage', () => {
		localStorage.setItem(
			LOCAL_STORAGE_NAMESPACE + ':localConfig',
			JSON.stringify({ hostUrl: 'https://stored-server.com' }),
		);

		const { result } = renderHook(() => useLocalConfig());

		expect(result.current[0].hostUrl).toBe('https://stored-server.com');
	});
});
