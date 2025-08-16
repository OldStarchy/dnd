import { OutboundNotification } from '@/sync/message/outbound';

export class DbChangeNotification<
	Record extends { id: string; revision: number },
> extends OutboundNotification {
	constructor(
		readonly collection: string,
		readonly rawRecords: Record[],
	) {
		super({
			type: 'db',
			collection,
			items: rawRecords,
		});
	}
}
