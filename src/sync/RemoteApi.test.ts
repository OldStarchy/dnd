import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { RemoteApi, type RemoteApiHandler } from './RemoteApi';
import type { Transport, TransportHandler } from './Transport';

// Mock transport implementation for testing
class MockTransport implements Transport<string> {
	private handler?: TransportHandler<string>;
	private _isOpen = false;
	public sentMessages: string[] = [];

	constructor(handler: TransportHandler<string>) {
		this.handler = handler;
	}

	async send(data: string): Promise<void> {
		if (!this._isOpen) {
			throw new Error('Transport is not open');
		}
		this.sentMessages.push(data);
	}

	close(): void {
		this._isOpen = false;
		this.handler?.handleClose.call(this);
	}

	isOpen(): boolean {
		return this._isOpen;
	}

	[Symbol.dispose](): void {
		this.close();
	}

	// Test helpers
	open(): void {
		this._isOpen = true;
		this.handler?.handleOpen.call(this);
	}

	simulateMessage(message: string): void {
		this.handler?.handleMessage.call(this, message);
	}

	getLastSentMessage(): unknown {
		const lastMessage = this.sentMessages[this.sentMessages.length - 1];
		return lastMessage ? JSON.parse(lastMessage) : null;
	}

	clearSentMessages(): void {
		this.sentMessages = [];
	}
}

// Test schemas
const TestRequestSchema = z.object({
	action: z.string(),
	payload: z.any().optional(),
});

const TestResultSchema = z.object({
	success: z.boolean(),
	data: z.any().optional(),
	error: z.string().optional(),
});

const TestNotificationSchema = z.object({
	event: z.string(),
	data: z.any().optional(),
});

type TestRequest = z.infer<typeof TestRequestSchema>;
type TestResult = z.infer<typeof TestResultSchema>;
type TestNotification = z.infer<typeof TestNotificationSchema>;

describe('RemoteApi', () => {
	let mockTransport: MockTransport;
	let mockHandler: RemoteApiHandler<
		RemoteApi<TestRequest, TestResult, TestNotification, TestNotification>,
		TestRequest,
		TestResult,
		TestNotification
	>;
	let remoteApi: RemoteApi<
		TestRequest,
		TestResult,
		TestNotification,
		TestNotification
	>;

	beforeEach(() => {
		mockHandler = {
			handleNotification: vi.fn(),
			handleRequest: vi.fn(),
			handleClose: vi.fn(),
		};

		remoteApi = new RemoteApi(
			TestRequestSchema,
			TestResultSchema,
			TestNotificationSchema,
			(handler) => {
				mockTransport = new MockTransport(handler);
				return mockTransport;
			},
			mockHandler,
		);
	});

	describe('constructor', () => {
		it('should create RemoteApi instance', () => {
			expect(remoteApi).toBeInstanceOf(RemoteApi);
			expect(mockTransport).toBeDefined();
		});

		it('should handle transport open', () => {
			mockTransport.open();
			expect(mockTransport.isOpen()).toBe(true);
		});
	});

	describe('notify', () => {
		it('should queue notification when transport is closed', async () => {
			const notification: TestNotification = {
				event: 'test',
				data: 'hello',
			};

			const notifyPromise = remoteApi.notify(notification);

			expect(mockTransport.sentMessages).toHaveLength(0);

			// Open transport to flush queue
			mockTransport.open();
			await notifyPromise;

			expect(mockTransport.sentMessages).toHaveLength(1);
			const sentMessage = JSON.parse(mockTransport.sentMessages[0]);
			expect(sentMessage).toEqual({
				type: 'notification',
				data: notification,
			});
		});

		it('should send notification immediately when transport is open', async () => {
			mockTransport.open();
			const notification: TestNotification = {
				event: 'test',
				data: 'hello',
			};

			await remoteApi.notify(notification);

			expect(mockTransport.sentMessages).toHaveLength(1);
			const sentMessage = JSON.parse(mockTransport.sentMessages[0]);
			expect(sentMessage).toEqual({
				type: 'notification',
				data: notification,
			});
		});
	});

	describe('request', () => {
		it('should send request and resolve with response', async () => {
			mockTransport.open();
			const request: TestRequest = { action: 'getData' };
			const expectedResult: TestResult = {
				success: true,
				data: 'result',
			};

			// Start the request
			const requestPromise = remoteApi.request(request);

			// Verify request was sent
			expect(mockTransport.sentMessages).toHaveLength(1);
			const sentMessage = JSON.parse(mockTransport.sentMessages[0]);
			expect(sentMessage.type).toBe('request');
			expect(sentMessage.data).toEqual(request);
			expect(sentMessage.id).toBeDefined();

			// Simulate response
			const responseMessage = {
				type: 'response',
				id: sentMessage.id,
				data: expectedResult,
			};
			mockTransport.simulateMessage(JSON.stringify(responseMessage));

			// Wait for promise to resolve
			const result = await requestPromise;
			expect(result).toEqual(expectedResult);
		});

		it('should reject request on response error', async () => {
			mockTransport.open();
			const request: TestRequest = { action: 'getData' };

			// Start the request
			const requestPromise = remoteApi.request(request);

			// Get the request ID
			const sentMessage = JSON.parse(mockTransport.sentMessages[0]);

			// Simulate error response
			const errorMessage = {
				type: 'response-error',
				id: sentMessage.id,
				error: 'Something went wrong',
			};
			mockTransport.simulateMessage(JSON.stringify(errorMessage));

			// Wait for promise to reject
			await expect(requestPromise).rejects.toThrow(
				'Something went wrong',
			);
		});

		it('should handle multiple concurrent requests', async () => {
			mockTransport.open();
			const request1: TestRequest = { action: 'getData1' };
			const request2: TestRequest = { action: 'getData2' };
			const result1: TestResult = { success: true, data: 'result1' };
			const result2: TestResult = { success: true, data: 'result2' };

			// Start both requests
			const promise1 = remoteApi.request(request1);
			const promise2 = remoteApi.request(request2);

			// Get request IDs
			const message1 = JSON.parse(mockTransport.sentMessages[0]);
			const message2 = JSON.parse(mockTransport.sentMessages[1]);

			// Respond to requests in reverse order
			mockTransport.simulateMessage(
				JSON.stringify({
					type: 'response',
					id: message2.id,
					data: result2,
				}),
			);

			mockTransport.simulateMessage(
				JSON.stringify({
					type: 'response',
					id: message1.id,
					data: result1,
				}),
			);

			// Both should resolve with correct results
			const [resolved1, resolved2] = await Promise.all([
				promise1,
				promise2,
			]);
			expect(resolved1).toEqual(result1);
			expect(resolved2).toEqual(result2);
		});

		it('should queue requests when transport is closed', async () => {
			const request: TestRequest = { action: 'getData' };

			// Start request while transport is closed
			const requestPromise = remoteApi.request(request);
			expect(mockTransport.sentMessages).toHaveLength(0);

			// Open transport
			mockTransport.open();

			// Request should now be sent
			expect(mockTransport.sentMessages).toHaveLength(1);

			// Simulate response
			const sentMessage = JSON.parse(mockTransport.sentMessages[0]);
			mockTransport.simulateMessage(
				JSON.stringify({
					type: 'response',
					id: sentMessage.id,
					data: { success: true },
				}),
			);

			await expect(requestPromise).resolves.toEqual({ success: true });
		});
	});

	describe('incoming message handling', () => {
		beforeEach(() => {
			mockTransport.open();
		});

		it('should handle incoming notifications', () => {
			const notification: TestNotification = {
				event: 'test',
				data: 'hello',
			};
			const message = {
				type: 'notification',
				data: notification,
			};

			mockTransport.simulateMessage(JSON.stringify(message));

			expect(mockHandler.handleNotification).toHaveBeenCalledWith(
				notification,
			);
		});

		it('should handle incoming requests and send responses', async () => {
			const request: TestRequest = { action: 'process' };
			const expectedResult: TestResult = {
				success: true,
				data: 'processed',
			};

			// Mock the handler to return a result
			vi.mocked(mockHandler.handleRequest).mockResolvedValue(
				expectedResult,
			);

			const message = {
				type: 'request',
				id: 'test-id',
				data: request,
			};

			mockTransport.simulateMessage(JSON.stringify(message));

			// Wait for async handling
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(mockHandler.handleRequest).toHaveBeenCalledWith(request);

			// Should send response
			expect(mockTransport.sentMessages).toHaveLength(1);
			const sentMessage = JSON.parse(mockTransport.sentMessages[0]);
			expect(sentMessage).toEqual({
				type: 'response',
				id: 'test-id',
				data: expectedResult,
			});
		});

		it('should handle request handler errors', async () => {
			const request: TestRequest = { action: 'fail' };

			// Mock the handler to throw an error
			vi.mocked(mockHandler.handleRequest).mockRejectedValue(
				new Error('Handler error'),
			);

			const message = {
				type: 'request',
				id: 'test-id',
				data: request,
			};

			mockTransport.simulateMessage(JSON.stringify(message));

			// Wait for async handling
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(mockHandler.handleRequest).toHaveBeenCalledWith(request);

			// Should send error response
			expect(mockTransport.sentMessages).toHaveLength(1);
			const sentMessage = JSON.parse(mockTransport.sentMessages[0]);
			expect(sentMessage).toEqual({
				type: 'response-error',
				id: 'test-id',
				error: 'Handler error',
			});
		});

		it('should ignore invalid messages', () => {
			const consoleSpy = vi
				.spyOn(console, 'error')
				.mockImplementation(() => {});

			// Send invalid JSON
			mockTransport.simulateMessage('invalid json');

			// Send valid JSON but invalid schema
			mockTransport.simulateMessage(JSON.stringify({ type: 'invalid' }));

			expect(consoleSpy).toHaveBeenCalledWith(
				'Failed to parse message as JSON:',
				'invalid json',
				expect.any(SyntaxError),
			);
			expect(consoleSpy).toHaveBeenCalledWith(
				'Invalid message data received:',
				{ type: 'invalid' },
				expect.any(Object),
			);
			expect(mockHandler.handleNotification).not.toHaveBeenCalled();
			expect(mockHandler.handleRequest).not.toHaveBeenCalled();

			consoleSpy.mockRestore();
		});

		it('should handle response for unknown request ID', () => {
			const consoleSpy = vi
				.spyOn(console, 'error')
				.mockImplementation(() => {});

			const message = {
				type: 'response',
				id: 'unknown-id',
				data: { success: true },
			};

			mockTransport.simulateMessage(JSON.stringify(message));

			expect(consoleSpy).toHaveBeenCalledWith(
				'No pending response found for id: unknown-id',
			);
			consoleSpy.mockRestore();
		});

		it('should handle error response for unknown request ID', () => {
			const consoleSpy = vi
				.spyOn(console, 'error')
				.mockImplementation(() => {});

			const message = {
				type: 'response-error',
				id: 'unknown-id',
				error: 'Some error',
			};

			mockTransport.simulateMessage(JSON.stringify(message));

			expect(consoleSpy).toHaveBeenCalledWith(
				'No pending response found for id: unknown-id',
			);
			consoleSpy.mockRestore();
		});
	});

	describe('transport lifecycle', () => {
		it('should handle transport close', () => {
			mockTransport.open();

			// Start a request
			const requestPromise = remoteApi.request({ action: 'test' });

			// Close transport
			mockTransport.close();

			// Request should be rejected
			expect(requestPromise).rejects.toThrow('Transport closed');
			expect(mockHandler.handleClose).toHaveBeenCalled();
		});

		it('should cleanup on dispose', () => {
			mockTransport.open();
			const closeSpy = vi.spyOn(mockTransport, 'close');

			remoteApi[Symbol.dispose]();

			expect(closeSpy).toHaveBeenCalled();
		});
	});

	describe('send queue management', () => {
		it('should flush queue when transport opens', async () => {
			// Queue multiple messages while transport is closed
			const promise1 = remoteApi.notify({ event: 'test1' });
			const promise2 = remoteApi.notify({ event: 'test2' });
			const promise3 = remoteApi.request({ action: 'test' });

			expect(mockTransport.sentMessages).toHaveLength(0);

			// Open transport
			mockTransport.open();

			// All messages should be sent
			expect(mockTransport.sentMessages).toHaveLength(3);

			// Wait for notifications to complete
			await Promise.all([promise1, promise2]);

			// Complete the request
			const requestMessage = JSON.parse(mockTransport.sentMessages[2]);
			mockTransport.simulateMessage(
				JSON.stringify({
					type: 'response',
					id: requestMessage.id,
					data: { success: true },
				}),
			);

			await promise3;
		});

		it('should handle send errors in queue', async () => {
			// Mock transport to fail on send
			const originalSend = mockTransport.send.bind(mockTransport);
			vi.spyOn(mockTransport, 'send').mockImplementation(async () => {
				throw new Error('Send failed');
			});

			mockTransport.open();

			const notifyPromise = remoteApi.notify({ event: 'test' });

			await expect(notifyPromise).rejects.toThrow('Send failed');

			// Restore original send
			mockTransport.send = originalSend;
		});
	});
});
