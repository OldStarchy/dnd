import { Observable, filter, map } from 'rxjs';
import type RoomHostConnection from '../room/RoomHostConnection';
import type { Transport } from '../Transport';

export class RoomHostConnectionTransport<TMessage>
	implements Transport<TMessage>
{
	private readonly connection: RoomHostConnection<TMessage>;
	readonly peerId: string;
	message$: Observable<TMessage>;
	constructor(connection: RoomHostConnection<TMessage>, peerId: string) {
		this.connection = connection;
		this.peerId = peerId;

		this.message$ = this.connection.messages$.pipe(
			filter(({ sender }) => sender === this.peerId),
			map(({ data }) => data),
		);
	}

	async send(data: TMessage): Promise<void> {
		await this.connection.sendTo(this.peerId, data);
	}

	close(): void {
		this.connection.close();
	}

	isOpen(): boolean {
		return this.connection.isOpen();
	}

	[Symbol.dispose](): void {
		this.close();
	}
}
