import { DocumentApi, type Collection } from '@/db/Collection';
import type { AnyRecordType } from '@/db/RecordType';
import { useEffect, useMemo, useRef } from 'react';
import { Observable } from 'rxjs';

export default function useCollectionQuery<RecordType extends AnyRecordType>(
	collection: Collection<RecordType>,
	filter?: RecordType['filter'],
): RecordType['record'][] {
	const observableRef = useRef<
		Observable<ReadonlySet<DocumentApi<RecordType>>>
	>(new Observable());

	const subscription = useMemo(() => {
		observableRef.current = collection.get$(filter);
		return observableRef.current;
	}, [collection, filter]);

	useEffect(() => {
		collection
			.get$(filter)
			.then((all) =>
				setResults(all.map((record) => record.data.getValue())),
			);

		const sub = collection.change$.subscribe((change) => {
			setResults((prev) => {
				if (change.type === 'delete') {
					return prev.filter((r) => r.id !== change.id);
				}

				const data = change.document.data.getValue();
				const matchesFilter = collection.filterFn(data, filter);

				switch (change.type) {
					case 'create': {
						if (matchesFilter) {
							return [...prev, data];
						}

						return prev;
					}

					case 'update': {
						if (matchesFilter) {
							return prev.map((r) =>
								r.id === data.id ? data : r,
							);
						} else {
							return prev.filter((r) => r.id !== data.id);
						}
					}
				}
			});
		});

		return () => sub.unsubscribe();
	}, [collection, filter]);

	return results;
}
