import { Observable } from 'rxjs';
import type * as Y from 'yjs';
import type { AbstractType } from 'yjs';

// oxlint-disable-next-line typescript/no-explicit-any
export default function fromDocObserveDeep<T extends AbstractType<any>>(doc: T) {
	return new Observable<ObservedDeep>((subscriber) => {
		// oxlint-disable-next-line typescript/no-explicit-any
		const onUpdate = (events: Y.YEvent<any>[], transaction: Y.Transaction) => {
			for (const event of events) {
				subscriber.next({ event, transaction });
			}
		};

		doc.observeDeep(onUpdate);

		return () => {
			doc.unobserveDeep(onUpdate);
		};
	});
}

export type ObservedDeep = {
	// oxlint-disable-next-line typescript/no-explicit-any
	event: Y.YEvent<any>;
	transaction: Y.Transaction;
};
