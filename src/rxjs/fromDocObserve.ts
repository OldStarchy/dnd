import { Observable } from 'rxjs';
import type * as Y from 'yjs';
import type { AbstractType } from 'yjs';

// oxlint-disable-next-line typescript/no-explicit-any
export default function fromDocObserve<T extends AbstractType<any>>(doc: T) {
	return new Observable<{
		event: T extends AbstractType<infer EventType> ? EventType : never;
		transaction: Y.Transaction;
	}>((subscriber) => {
		const onUpdate = (
			event: T extends AbstractType<infer EventType> ? EventType : never,
			transaction: Y.Transaction,
		) => {
			subscriber.next({ event, transaction });
		};

		doc.observe(onUpdate);

		return () => {
			doc.unobserve(onUpdate);
		};
	});
}

// oxlint-disable-next-line typescript/no-explicit-any
export type Observed<T extends AbstractType<any>> =
	T extends AbstractType<infer EventType>
		? { event: EventType; transaction: Y.Transaction }
		: never;
