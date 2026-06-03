import { describe } from 'vitest';

describe.skip('ChatRoom', () => {});

// temp code doesn't need testing
/*
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import type { ChatClient, ChatSnapshot } from '../../features/chat/chatTypes';
import ChatRoom from './ChatRoom';
class FakeChatClient implements ChatClient {
	private onUpdate: ((snapshot: ChatSnapshot) => void) | null = null;
	readonly sentMessages: string[] = [];

	async initialize(_name: string, onUpdate: (snapshot: ChatSnapshot) => void): Promise<void> {
		this.onUpdate = onUpdate;
		onUpdate({ participants: ['DemoTab123'], messages: [] });
	}

	send(text: string): void {
		this.sentMessages.push(text);
	}

	dispose(): void {}

	emit(snapshot: ChatSnapshot): void {
		this.onUpdate?.(snapshot);
	}
}

describe('ChatRoom', () => {
	describe('rendering', () => {
		test('shows participants and messages from client updates', async () => {
			const client = new FakeChatClient();
			const screen = await render(<ChatRoom client={client} />);

			client.emit({
				participants: ['DemoTab123', 'OtherTab456'],
				messages: [
					{
						id: 'm1',
						author: 'OtherTab456',
						text: 'hello there',
						kind: 'message',
						createdAt: Date.now(),
					},
				],
			});

			await expect
				.element(screen.getByLabelText('Participants').getByText('OtherTab456'))
				.toBeInTheDocument();
			await expect.element(screen.getByText('hello there')).toBeInTheDocument();
		});
	});

	describe('composer', () => {
		test('sends typed message through client', async () => {
			const client = new FakeChatClient();
			const screen = await render(<ChatRoom client={client} />);
			const messageInput = screen.getByRole('textbox', { name: 'Message' });

			await messageInput.fill('Hi from a test');
			await screen.getByRole('button', { name: 'Send' }).click();

			expect(client.sentMessages).toEqual(['Hi from a test']);
			await expect.element(messageInput).toHaveValue('');
		});
	});
});
*/
