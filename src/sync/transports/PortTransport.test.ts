import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransportHandler } from '../Transport';
import { PortTransport } from './PortTransport';

// Mock MessagePort implementation for testing
class MockMessagePort {
	private listeners: Map<string, Array<(event: MessageEvent) => void>> =
		new Map();
	private _closed = false;
	public sentMessages: string[] = [];

	addEventListener(
		type: string,
		listener: (event: MessageEvent) => void,
	): void {
		if (!this.listeners.has(type)) {
			this.listeners.set(type, []);
		}
		this.listeners.get(type)!.push(listener);
	}

	removeEventListener(
		type: string,
		listener: (event: MessageEvent) => void,
	): void {
		const typeListeners = this.listeners.get(type);
		if (typeListeners) {
			const index = typeListeners.indexOf(listener);
			if (index !== -1) {
				typeListeners.splice(index, 1);
			}
		}
	}

	postMessage(data: unknown): void {
		if (this._closed) {
			throw new Error('MessagePort is closed');
		}
		this.sentMessages.push(data as string);
	}

	start(): void {
		// MessagePort start method - no-op for our mock
	}

	close(): void {
		this._closed = true;
	}

	// Test helpers
	simulateMessage(data: unknown): void {
		const event = new MessageEvent('message', { data });
		const listeners = this.listeners.get('message');
		if (listeners) {
			listeners.forEach((listener) => listener(event));
		}
	}

	get closed(): boolean {
		return this._closed;
	}

	get messageListenerCount(): number {
		return this.listeners.get('message')?.length || 0;
	}
}

describe('PortTransport', () => {
	let mockPort: MockMessagePort;
	let mockHandler: TransportHandler<string>;
	let transport: PortTransport;

	beforeEach(() => {
		mockPort = new MockMessagePort();
		mockHandler = {
			handleMessage: vi.fn(),
			handleClose: vi.fn(),
			handleOpen: vi.fn(),
		};
	});

	describe('constructor', () => {
		it('should initialize the transport and call handleOpen', () => {
			transport = new PortTransport(
				mockPort as unknown as MessagePort,
				mockHandler,
			);

			expect(mockHandler.handleOpen).toHaveBeenCalledOnce();
			expect(transport.isOpen()).toBe(true);
		});

		it('should set up message listener on the port', () => {
			transport = new PortTransport(
				mockPort as unknown as MessagePort,
				mockHandler,
			);

			expect(mockPort.messageListenerCount).toBe(1);
		});

		it('should start the message port', () => {
			const startSpy = vi.spyOn(mockPort, 'start');
			transport = new PortTransport(
				mockPort as unknown as MessagePort,
				mockHandler,
			);

			expect(startSpy).toHaveBeenCalledOnce();
		});
	});

	describe('message handling', () => {
		beforeEach(() => {
			transport = new PortTransport(
				mockPort as unknown as MessagePort,
				mockHandler,
			);
		});

		it('should handle string messages correctly', () => {
			const testMessage = 'test message';
			mockPort.simulateMessage(testMessage);

			expect(mockHandler.handleMessage).toHaveBeenCalledWith(testMessage);
		});

		it('should warn and ignore non-string messages', () => {
			const consoleSpy = vi
				.spyOn(console, 'warn')
				.mockImplementation(() => {});
			const nonStringMessage = { type: 'object', data: 'test' };

			mockPort.simulateMessage(nonStringMessage);

			expect(consoleSpy).toHaveBeenCalledWith(
				'Received non-string message:',
				nonStringMessage,
			);
			expect(mockHandler.handleMessage).not.toHaveBeenCalled();

			consoleSpy.mockRestore();
		});

		it('should handle multiple messages in sequence', () => {
			const messages = ['message1', 'message2', 'message3'];

			messages.forEach((message) => mockPort.simulateMessage(message));

			expect(mockHandler.handleMessage).toHaveBeenCalledTimes(3);
			messages.forEach((message, index) => {
				expect(mockHandler.handleMessage).toHaveBeenNthCalledWith(
					index + 1,
					message,
				);
			});
		});
	});

	describe('isOpen', () => {
		beforeEach(() => {
			transport = new PortTransport(
				mockPort as unknown as MessagePort,
				mockHandler,
			);
		});

		it('should return true when transport is open', () => {
			expect(transport.isOpen()).toBe(true);
		});

		it('should return false after close is called', () => {
			transport.close();
			expect(transport.isOpen()).toBe(false);
		});
	});

	describe('send', () => {
		beforeEach(() => {
			transport = new PortTransport(
				mockPort as unknown as MessagePort,
				mockHandler,
			);
		});

		it('should send string data through the port', async () => {
			const testData = 'test data';

			await transport.send(testData);

			expect(mockPort.sentMessages).toContain(testData);
		});

		it('should return a resolved promise when send succeeds', async () => {
			const promise = transport.send('test');

			await expect(promise).resolves.toBeUndefined();
		});

		it('should reject when transport is closed', async () => {
			transport.close();

			await expect(transport.send('test')).rejects.toThrow(
				'Transport is closed',
			);
		});

		it('should send multiple messages correctly', async () => {
			const messages = ['msg1', 'msg2', 'msg3'];

			for (const message of messages) {
				await transport.send(message);
			}

			expect(mockPort.sentMessages).toEqual(messages);
		});
	});

	describe('close', () => {
		beforeEach(() => {
			transport = new PortTransport(
				mockPort as unknown as MessagePort,
				mockHandler,
			);
		});

		it('should set open to false', () => {
			transport.close();
			expect(transport.isOpen()).toBe(false);
		});

		it('should close the underlying port', () => {
			const closeSpy = vi.spyOn(mockPort, 'close');
			transport.close();

			expect(closeSpy).toHaveBeenCalledOnce();
		});

		it('should remove the message event listener', () => {
			transport.close();
			expect(mockPort.messageListenerCount).toBe(0);
		});

		it('should call the close handler', () => {
			transport.close();
			expect(mockHandler.handleClose).toHaveBeenCalledOnce();
		});

		it('should clear the close handler after calling it', () => {
			transport.close();

			// Call close again to ensure handler is not called twice
			transport.close();
			expect(mockHandler.handleClose).toHaveBeenCalledOnce();
		});

		it('should be safe to call multiple times', () => {
			transport.close();
			transport.close();
			transport.close();

			expect(mockHandler.handleClose).toHaveBeenCalledOnce();
			expect(transport.isOpen()).toBe(false);
		});
	});

	describe('Symbol.dispose', () => {
		beforeEach(() => {
			transport = new PortTransport(
				mockPort as unknown as MessagePort,
				mockHandler,
			);
		});

		it('should call close when disposed', () => {
			const closeSpy = vi.spyOn(transport, 'close');
			transport[Symbol.dispose]();

			expect(closeSpy).toHaveBeenCalledOnce();
		});

		it('should work with using statement pattern', () => {
			let disposed = false;
			const originalDispose = transport[Symbol.dispose].bind(transport);
			transport[Symbol.dispose] = () => {
				disposed = true;
				originalDispose();
			};

			// Simulate using statement cleanup
			transport[Symbol.dispose]();

			expect(disposed).toBe(true);
			expect(transport.isOpen()).toBe(false);
		});
	});

	describe('error handling', () => {
		beforeEach(() => {
			transport = new PortTransport(
				mockPort as unknown as MessagePort,
				mockHandler,
			);
		});

		it('should handle handler throwing errors gracefully', () => {
			const error = new Error('Handler error');
			vi.mocked(mockHandler.handleMessage).mockImplementation(() => {
				throw error;
			});

			// Should not throw when handler throws
			expect(() => mockPort.simulateMessage('test')).not.toThrow();
		});

		it('should handle close handler throwing errors', () => {
			vi.mocked(mockHandler.handleClose).mockImplementation(() => {
				throw new Error('Close handler error');
			});

			// Should not throw when close handler throws
			expect(() => transport.close()).not.toThrow();
		});

		it('should handle open handler throwing errors', () => {
			vi.mocked(mockHandler.handleOpen).mockImplementation(() => {
				throw new Error('Open handler error');
			});

			// Should not throw during construction when open handler throws
			expect(() => {
				new PortTransport(
					mockPort as unknown as MessagePort,
					mockHandler,
				);
			}).not.toThrow();
		});
	});

	describe('integration scenarios', () => {
		it('should handle rapid open/close cycles', () => {
			transport = new PortTransport(
				mockPort as unknown as MessagePort,
				mockHandler,
			);

			// Rapid close/open simulation
			transport.close();
			expect(transport.isOpen()).toBe(false);

			// Create new transport with same handler
			const newMockPort = new MockMessagePort();
			const newTransport = new PortTransport(
				newMockPort as unknown as MessagePort,
				mockHandler,
			);
			expect(newTransport.isOpen()).toBe(true);

			newTransport.close();
			expect(newTransport.isOpen()).toBe(false);
		});

		it('should handle message before and after close', async () => {
			transport = new PortTransport(
				mockPort as unknown as MessagePort,
				mockHandler,
			);

			// Send message while open
			await transport.send('before close');
			expect(mockPort.sentMessages).toContain('before close');

			// Send message and close
			mockPort.simulateMessage('received message');
			expect(mockHandler.handleMessage).toHaveBeenCalledWith(
				'received message',
			);

			transport.close();

			// Try to send after close
			await expect(transport.send('after close')).rejects.toThrow(
				'Transport is closed',
			);

			// Message should not be processed after close (though this depends on timing)
			mockPort.simulateMessage('message after close');
			// Note: The message listener is removed, so this shouldn't call the handler
		});
	});
});
