import { describe, expect, test } from 'vitest';
import { chatReducer, createInitialChatState, type ChatViewState } from './chatState';

describe('chatState', () => {
	describe('createInitialChatState', () => {
		test('returns state with provided tab name', () => {
			const state = createInitialChatState('RapidComet123');

			expect(state).toEqual({
				status: 'idle',
				tabName: 'RapidComet123',
				participants: [],
				messages: [],
				draft: '',
			});
		});
	});

	describe('chatReducer', () => {
		describe('connection actions', () => {
			test('marks status as connecting', () => {
				const state = createInitialChatState('RapidComet123');

				expect(chatReducer(state, { type: 'connect:start' }).status).toBe('connecting');
			});

			test('marks status as connected', () => {
				const state = createInitialChatState('RapidComet123');

				expect(chatReducer(state, { type: 'connect:success' }).status).toBe('connected');
			});

			test('marks status as unsupported', () => {
				const state = createInitialChatState('RapidComet123');

				expect(chatReducer(state, { type: 'connect:unsupported' }).status).toBe('unsupported');
			});
		});

		describe('draft actions', () => {
			test('updates draft text', () => {
				const state = createInitialChatState('RapidComet123');

				expect(chatReducer(state, { type: 'draft:update', value: 'hello' }).draft).toBe('hello');
			});

			test('clears draft after send', () => {
				const withDraft: ChatViewState = {
					...createInitialChatState('RapidComet123'),
					draft: 'pending',
				};

				expect(chatReducer(withDraft, { type: 'message:sent' }).draft).toBe('');
			});
		});

		describe('snapshot actions', () => {
			test('replaces participants and messages from snapshot', () => {
				const state = createInitialChatState('RapidComet123');

				const nextState = chatReducer(state, {
					type: 'snapshot:received',
					snapshot: {
						participants: ['RapidComet123'],
						messages: [
							{
								id: 'm1',
								author: 'RapidComet123',
								text: 'hello',
								kind: 'message',
								createdAt: 1,
							},
						],
					},
				});

				expect(nextState.participants).toEqual(['RapidComet123']);
				expect(nextState.messages).toHaveLength(1);
			});
		});
	});
});
