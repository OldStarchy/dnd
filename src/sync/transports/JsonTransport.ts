import type { Observable } from 'rxjs';
import type z from 'zod';

import filterMap, { Skip } from '@/lib/filterMap';
import type { ClosableTransport, Transport } from '@/sync/transports/Transport';

export default class JsonTransport<Send, Receive>
	implements Transport<Send, Receive>
{
	constructor(
		protected transport: Transport<string, unknown>,
		protected schema: z.ZodSchema<Receive>,
	) {
		this.message$ = this.transport.message$.pipe(
			filterMap((json) => {
				if (typeof json !== 'string') return Skip;

				const parsed = this.schema.safeParse(JSON.parse(json));
				if (!parsed.success) {
					console.error('Invalid message format:', parsed.error);
					return Skip;
				}

				return parsed.data;
			}),
		);
	}

	send(data: Send): Promise<void> {
		const json = JSON.stringify(data);
		return this.transport.send(json);
	}

	readonly message$: Observable<Receive>;

	get state$() {
		return this.transport.state$;
	}
}

export class ClosableJsonTransport<Send, Receive>
	extends JsonTransport<Send, Receive>
	implements ClosableTransport<Send, Receive>
{
	declare protected transport: ClosableTransport<string, unknown>;

	constructor(
		transport: ClosableTransport<string, unknown>,
		schema: z.ZodSchema<Receive>,
	) {
		super(transport, schema);
	}

	close(): void {
		this.transport.close();
	}
}
