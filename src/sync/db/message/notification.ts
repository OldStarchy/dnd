import { OutboundNotification } from '@/sync/message/outbound';

export class DbChangeNotification<
	Record extends { id: string; revision: number },
> extends OutboundNotification {
	constructor(
		readonly subscriptionId: string,
		readonly rawRecords: Record[],
	) {
		super({
			type: 'db',
			subscriptionId,
			items: rawRecords,
		});
	}
}
