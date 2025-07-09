import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {TransportHandler} from '../Transport';
import {WebSocketTransport, type WebSocketData} from './WebSocketTransport';

// Mock WebSocket
class MockWebSocket {
	readyState: number = 0; // CONNECTING

	static readonly CONNECTING = 0;
	static readonly OPEN = 1;
	static readonly CLOSING = 2;
	static readonly CLOSED = 3;

	addEventListener = vi.fn();
	removeEventListener = vi.fn();
	send = vi.fn();
	close = vi.fn().mockImplementation(() => {
		this.readyState = MockWebSocket.CLOSED;
	});

	// Helper methods for testing
	triggerOpen() {
		this.readyState = MockWebSocket.OPEN;
		const openHandler = this.addEventListener.mock.calls.find(call => call[0] === 'open')?.[1];
		if (openHandler) openHandler();
	}

	triggerMessage(data: WebSocketData) {
		const messageHandler = this.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
		if (messageHandler) messageHandler({ data });
	}

	triggerClose() {
		this.readyState = MockWebSocket.CLOSED;
		const closeHandler = this.addEventListener.mock.calls.find(call => call[0] === 'close')?.[1];
		if (closeHandler) closeHandler();
	}

	triggerError() {
		const errorHandler = this.addEventListener.mock.calls.find(call => call[0] === 'error')?.[1];
		if (errorHandler) errorHandler(new Event('error'));
	}
}

// Mock global WebSocket
Object.defineProperty(global, 'WebSocket', {
	value: MockWebSocket,
	writable: true,
});

describe('WebSocketTransport', () => {
	let mockWs: MockWebSocket;
	let mockHandler: TransportHandler<WebSocketData>;
	let transport: WebSocketTransport;

	beforeEach(() => {
		mockWs = new MockWebSocket();
		mockHandler = {
			handleMessage: vi.fn(),
			handleClose: vi.fn(),
			handleOpen: vi.fn(),
		};
	});

	afterEach(() => {
		if (transport) {
			transport.close();
		}
	});

	it('should create transport and set up event listeners', () => {
		transport = new WebSocketTransport(mockWs as unknown as WebSocket, mockHandler);

		expect(mockWs.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
		expect(mockWs.addEventListener).toHaveBeenCalledWith('open', expect.any(Function));
		expect(mockWs.addEventListener).toHaveBeenCalledWith('close', expect.any(Function));
		expect(mockWs.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
	});

	it('should handle open event and call handler', () => {
		transport = new WebSocketTransport(mockWs as unknown as WebSocket, mockHandler);

		mockWs.triggerOpen();

		expect(mockHandler.handleOpen).toHaveBeenCalledOnce();
		expect(transport.isOpen()).toBe(true);
	});

	it('should handle already open WebSocket', () => {
		mockWs.readyState = MockWebSocket.OPEN;
		transport = new WebSocketTransport(mockWs as unknown as WebSocket, mockHandler);

		expect(mockHandler.handleOpen).toHaveBeenCalledOnce();
		expect(transport.isOpen()).toBe(true);
	});

	it('should handle string messages', () => {
		transport = new WebSocketTransport(mockWs as unknown as WebSocket, mockHandler);
		const testMessage = 'test message';

		mockWs.triggerMessage(testMessage);

		expect(mockHandler.handleMessage).toHaveBeenCalledWith(testMessage);
	});

	it('should handle ArrayBuffer messages', () => {
		transport = new WebSocketTransport(mockWs as unknown as WebSocket, mockHandler);
		const testBuffer = new ArrayBuffer(8);

		mockWs.triggerMessage(testBuffer);

		expect(mockHandler.handleMessage).toHaveBeenCalledWith(testBuffer);
	});

	it('should handle Blob messages', () => {
		transport = new WebSocketTransport(mockWs as unknown as WebSocket, mockHandler);
		const testBlob = new Blob(['test']);

		mockWs.triggerMessage(testBlob);

		expect(mockHandler.handleMessage).toHaveBeenCalledWith(testBlob);
	});

	it('should warn about unsupported message types', () => {
		const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		transport = new WebSocketTransport(mockWs as unknown as WebSocket, mockHandler);

		mockWs.triggerMessage(123 as unknown as WebSocketData);

		expect(consoleSpy).toHaveBeenCalledWith('Received unsupported message type:', 'number', 123);
		expect(mockHandler.handleMessage).not.toHaveBeenCalled();

		consoleSpy.mockRestore();
	});

	it('should send string data when open', async () => {
		transport = new WebSocketTransport(mockWs as unknown as WebSocket, mockHandler);
		mockWs.triggerOpen();

		await transport.send('test message');

		expect(mockWs.send).toHaveBeenCalledWith('test message');
	});

	it('should send binary data when open', async () => {
		transport = new WebSocketTransport(mockWs as unknown as WebSocket, mockHandler);
		mockWs.triggerOpen();
		const testBuffer = new ArrayBuffer(8);

		await transport.send(testBuffer);

		expect(mockWs.send).toHaveBeenCalledWith(testBuffer);
	});

	it('should reject send when WebSocket is not open', async () => {
		transport = new WebSocketTransport(mockWs as unknown as WebSocket, mockHandler);

		await expect(transport.send('test')).rejects.toThrow('WebSocket is not open');
		expect(mockWs.send).not.toHaveBeenCalled();
	});

	it('should handle send errors', async () => {
		transport = new WebSocketTransport(mockWs as unknown as WebSocket, mockHandler);
		mockWs.triggerOpen();
		mockWs.send.mockImplementation(() => {
			throw new Error('Send failed');
		});

		await expect(transport.send('test')).rejects.toThrow('Send failed');
	});

	it('should handle close event', () => {
		transport = new WebSocketTransport(mockWs as unknown as WebSocket, mockHandler);

		mockWs.triggerClose();

		expect(mockHandler.handleClose).toHaveBeenCalledOnce();
		expect(transport.isOpen()).toBe(false);
	});

	it('should close WebSocket and clean up listeners', () => {
		transport = new WebSocketTransport(mockWs as unknown as WebSocket, mockHandler);
		mockWs.triggerOpen();

		transport.close();

		expect(mockWs.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
		expect(mockWs.removeEventListener).toHaveBeenCalledWith('open', expect.any(Function));
		expect(mockWs.removeEventListener).toHaveBeenCalledWith('close', expect.any(Function));
		expect(mockWs.removeEventListener).toHaveBeenCalledWith('error', expect.any(Function));
		expect(mockWs.close).toHaveBeenCalledOnce();
		expect(transport.isOpen()).toBe(false);
	});

	it('should implement Symbol.dispose', () => {
		transport = new WebSocketTransport(mockWs as unknown as WebSocket, mockHandler);
		const closeSpy = vi.spyOn(transport, 'close');

		transport[Symbol.dispose]();

		expect(closeSpy).toHaveBeenCalledOnce();
	});

	it('should handle errors in message handler gracefully', () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const mockHandleMessage = vi.fn().mockImplementation(() => {
			throw new Error('Handler error');
		});
		const errorHandler: TransportHandler<WebSocketData> = {
			handleMessage: mockHandleMessage,
			handleClose: vi.fn(),
			handleOpen: vi.fn(),
		};
		transport = new WebSocketTransport(mockWs as unknown as WebSocket, errorHandler);

		mockWs.triggerMessage('test');

		expect(consoleErrorSpy).toHaveBeenCalledWith('Error in handleMessage:', expect.any(Error));
		consoleErrorSpy.mockRestore();
	});

	it('should handle errors in close handler gracefully', () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const mockHandleClose = vi.fn().mockImplementation(() => {
			throw new Error('Close handler error');
		});
		const errorHandler: TransportHandler<WebSocketData> = {
			handleMessage: vi.fn(),
			handleClose: mockHandleClose,
			handleOpen: vi.fn(),
		};
		transport = new WebSocketTransport(mockWs as unknown as WebSocket, errorHandler);

		mockWs.triggerClose();

		expect(consoleErrorSpy).toHaveBeenCalledWith('Error in handleClose:', expect.any(Error));
		consoleErrorSpy.mockRestore();
	});

	it('should handle errors in open handler gracefully', () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const mockHandleOpen = vi.fn().mockImplementation(() => {
			throw new Error('Open handler error');
		});
		const errorHandler: TransportHandler<WebSocketData> = {
			handleMessage: vi.fn(),
			handleClose: vi.fn(),
			handleOpen: mockHandleOpen,
		};
		mockWs.readyState = MockWebSocket.OPEN;

		transport = new WebSocketTransport(mockWs as unknown as WebSocket, errorHandler);

		expect(consoleErrorSpy).toHaveBeenCalledWith('Error in handleOpen:', expect.any(Error));
		consoleErrorSpy.mockRestore();
	});
});
