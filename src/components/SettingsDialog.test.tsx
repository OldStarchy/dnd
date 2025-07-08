import '@/index.css';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { SettingsDialog } from './SettingsDialog';

// Mock the useServerConfig hook
const mockSetServerUrl = vi.fn();
vi.mock('@/hooks/useServerConfig', () => ({
	useServerConfig: vi.fn(() => ['', mockSetServerUrl]),
}));

describe('SettingsDialog', () => {
	beforeEach(() => {
		mockSetServerUrl.mockClear();
	});

	it('renders the settings dialog with correct elements', async () => {
		const screen = render(
			<SettingsDialog open={true} onOpenChange={() => {}} />
		);

		expect(screen.getByRole('dialog', { name: 'Settings' })).toBeVisible();
		expect(screen.getByText('Configure your server connection settings. Leave blank to use the current page\'s server.')).toBeVisible();
		expect(screen.getByLabelText('Server URL')).toBeVisible();
		expect(screen.getByRole('button', { name: 'Reset to Default' })).toBeVisible();
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();
		expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
	});

	it('saves the server URL when Save is clicked', async () => {
		const onOpenChange = vi.fn();
		const screen = render(
			<SettingsDialog open={true} onOpenChange={onOpenChange} />
		);

		const input = screen.getByLabelText('Server URL');
		await input.fill('https://test-server.com');
		
		await screen.getByRole('button', { name: 'Save' }).click();

		expect(mockSetServerUrl).toHaveBeenCalledWith('https://test-server.com');
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it('resets the server URL when Reset to Default is clicked', async () => {
		const screen = render(
			<SettingsDialog open={true} onOpenChange={() => {}} />
		);

		const input = screen.getByLabelText('Server URL');
		await input.fill('https://test-server.com');
		
		await screen.getByRole('button', { name: 'Reset to Default' }).click();

		expect(input.value).toBe('');
	});

	it('cancels changes when Cancel is clicked', async () => {
		const onOpenChange = vi.fn();
		const screen = render(
			<SettingsDialog open={true} onOpenChange={onOpenChange} />
		);

		const input = screen.getByLabelText('Server URL');
		await input.fill('https://test-server.com');
		
		await screen.getByRole('button', { name: 'Cancel' }).click();

		expect(mockSetServerUrl).not.toHaveBeenCalled();
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});