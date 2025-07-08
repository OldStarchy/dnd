import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import { useServerConfig } from './useServerConfig';

describe('useServerConfig', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('returns empty string as default server URL', () => {
		const { result } = renderHook(() => useServerConfig());

		expect(result.current[0]).toBe('');
	});

	it('updates and persists server URL', () => {
		const { result, act } = renderHook(() => useServerConfig());

		act(() => {
			result.current[1]('https://test-server.com');
		});

		expect(result.current[0]).toBe('https://test-server.com');
		expect(localStorage.getItem('server-url')).toBe(
			'https://test-server.com',
		);
	});

	it('loads server URL from localStorage', () => {
		localStorage.setItem('server-url', 'https://stored-server.com');

		const { result } = renderHook(() => useServerConfig());

		expect(result.current[0]).toBe('https://stored-server.com');
	});
});
