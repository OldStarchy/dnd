import type { Collection } from '@/db/Collection';
import type { AnyRecordType } from '@/db/RecordType';
import { useEffect, useState } from 'react';

export default function useCollectionQuery<RecordType extends AnyRecordType>(
	collection: Collection<RecordType>,
	filter?: (item: RecordType['record']) => boolean,
): RecordType['record'][] {
	const [results, setResults] = useState<RecordType['record'][]>([]);

	useEffect(() => {
		collection
			.get(filter)
			.then((all) =>
				setResults(all.map((record) => record.data.getValue())),
			);

		const sub = collection.change$.subscribe((record) => {
			setResults((prev) => {
				if (prev.some((r) => r.id === record.data.getValue().id)) {
					return prev.map((r) =>
						r.id === record.data.getValue().id
							? record.data.getValue()
							: r,
					);
				} else {
					return [...prev, record.data.getValue()];
				}
			});
		});

		return () => sub.unsubscribe();
	}, [collection, filter]);

	return results;
}
