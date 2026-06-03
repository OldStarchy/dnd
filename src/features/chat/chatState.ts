import type { ChatSnapshot } from './chatTypes';

export interface ChatViewState {
	status: 'idle' | 'connecting' | 'connected' | 'unsupported';
	tabName: string;
	participants: string[];
	messages: ChatSnapshot['messages'];
	draft: string;
}

export type ChatAction =
	| { type: 'connect:start' }
	| { type: 'connect:success' }
	| { type: 'connect:unsupported' }
	| { type: 'disconnect' }
	| { type: 'draft:update'; value: string }
	| { type: 'message:sent' }
	| { type: 'snapshot:received'; snapshot: ChatSnapshot };

export function createInitialChatState(tabName: string): ChatViewState {
	return {
		status: 'idle',
		tabName,
		participants: [],
		messages: [],
		draft: '',
	};
}

export function chatReducer(state: ChatViewState, action: ChatAction): ChatViewState {
	switch (action.type) {
		case 'connect:start':
			return { ...state, status: 'connecting' };
		case 'connect:success':
			return { ...state, status: 'connected' };
		case 'connect:unsupported':
			return { ...state, status: 'unsupported' };
		case 'disconnect':
			return createInitialChatState(state.tabName);
		case 'draft:update':
			return { ...state, draft: action.value };
		case 'message:sent':
			return { ...state, draft: '' };
		case 'snapshot:received':
			return {
				...state,
				participants: action.snapshot.participants,
				messages: action.snapshot.messages,
			};
		default:
			return state;
	}
}
