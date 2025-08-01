import type { Collection } from '@/db/Collection';
import { Subscription } from 'rxjs';
import type { RemoteApi } from '../RemoteApi';
import type {
	DbNotificationMessages,
	DbRequestMessages,
	DbResponseMessages,
} from './Messages';

function isDbRequestActionMessage<T, const TAction>(
	message: DbRequestMessages<T>,
	action: TAction,
): message is typeof message & { type: 'db'; action: TAction } {
	return message.type === 'db' && message.action === action;
}

export class CollectionHost<T extends { id: string; revision: number }> {
	readonly source: Collection<T, unknown>;
	constructor(source: Collection<T, unknown>) {
		this.source = source;
	}

	provide(
		connection: RemoteApi<
			void,
			void,
			DbRequestMessages<T>,
			DbResponseMessages<T>,
			DbNotificationMessages<T>,
			void
		>,
	) {
		const subscription = new Subscription();

		const sub = this.source.change$.subscribe((doc) => {
			connection.notify({
				type: 'db',
				collection: this.source.name,
				items: [doc.data.getValue()],
			} as DbNotificationMessages<T>);
		});
		subscription.add(sub);

		const sub2 = connection.$request.on(
			(request): Promise<DbResponseMessages<T>> | null => {
				if (request.type !== 'db') return null;
				if (request.collection !== this.source.name) return null;

				if (isDbRequestActionMessage(request, 'get')) {
					return this.source.get(request.action).then((result) => {
						return {
							type: 'db',
							collection: this.source.name,
							action: 'get',
							data: result.map((item) => item.data.getValue()),
						};
					});
				} else if (isDbRequestActionMessage(request, 'getOne')) {
					return this.source.getOne(request.filter).then((result) => {
						return {
							type: 'db',
							collection: this.source.name,
							action: 'getOne',
							data: result && result.data.getValue(),
						};
					});
				} else if (isDbRequestActionMessage(request, 'create')) {
					return this.source
						.create(request.data as T)
						.then((result) => {
							return {
								type: 'db',
								collection: this.source.name,
								action: 'create',
								data: result.data.getValue(),
							};
						});
				}
				return null;
			},
		);
		subscription.add(sub2);

		return subscription;
	}
}
