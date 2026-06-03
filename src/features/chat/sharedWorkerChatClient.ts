import createUid from '../../lib/createUid';
import ChatWorker from '../../shared-worker/chat-shared-worker?sharedworker';
import type { ChatClient, ChatSnapshot, ChatUpdateMessage } from './chatTypes';

export interface SharedWorkerFactory {
	new (scriptURL: string, options?: WorkerOptions): SharedWorker;
}

function isChatUpdateMessage(value: unknown): value is ChatUpdateMessage {
	if (!value || typeof value !== 'object') {
		return false;
	}
	if (!('type' in value) || !('payload' in value)) {
		return false;
	}
	return (
		value.type === 'chat:update' && typeof value.payload === 'object' && value.payload !== null
	);
}

export class SharedWorkerChatClient implements ChatClient, Disposable {
	readonly id = createUid();

	private constructor(
		private name: string,
		private readonly onUpdate: (snapshot: ChatSnapshot) => void,
		private readonly worker: SharedWorker,
	) {
		this.worker.port.addEventListener('message', this.handleMessage);
		this.worker.port.start();

		this.post({ type: 'chat:join', name: this.name });
		this.post({ type: 'chat:sync-request' });
	}

	private readonly handleMessage = (event: MessageEvent) => {
		if (!this.onUpdate || !isChatUpdateMessage(event.data)) {
			return;
		}
		this.onUpdate(event.data.payload);
	};

	static async create(
		name: string,
		onUpdate: (snapshot: ChatSnapshot) => void,
	): Promise<SharedWorkerChatClient> {
		const worker = new ChatWorker();
		if (!worker) {
			throw new Error('Shared workers are unavailable in this browser.');
		}

		console.log('Initializing chat client with name:', name);

		return new SharedWorkerChatClient(name, onUpdate, worker);
	}

	send(text: string): void {
		const normalized = text.trim();
		if (!normalized) {
			return;
		}
		this.post({ type: 'chat:send', author: this.name, text: normalized });
	}

	[Symbol.dispose](): void {
		if (this.name) {
			this.post({ type: 'chat:leave', name: this.name });
		}

		this.worker.port.removeEventListener('message', this.handleMessage);
		this.worker.port.close();

		// oxlint-disable-next-line typescript/consistent-type-assertions, typescript/no-explicit-any
		const self = this as any;

		delete self.id;
		delete self.name;
		delete self.worker;
		delete self.onUpdate;
	}

	private post(message: Record<string, unknown>): void {
		this.worker?.port.postMessage(message);
	}
}
