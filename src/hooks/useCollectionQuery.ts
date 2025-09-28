import { useEffect, useState } from 'react';

import type { Collection, DocumentApi } from '@/db/Collection';
import type { AnyRecordType } from '@/db/RecordType';

/**
 * Calls collection.get$ with the given filter.
 *
 * ! Make sure you memoize the filter object.
 */
export default function useCollectionQuery<RecordType extends AnyRecordType>(
	collection: Collection<RecordType>,
	filter?: RecordType['filter'],
): ReadonlySet<DocumentApi<RecordType>> {
	const [records, setRecords] = useState<
		ReadonlySet<DocumentApi<RecordType>>
	>(new Set());

	useEffect(() => {
		const subscription = collection
			.get$(filter)
			.subscribe((records) => setRecords(records));

		return () => subscription.unsubscribe();
	}, [collection, filter]);

	return records;
}
