import { useMemo } from 'react';

import type { Collection } from '@/db/Collection';
import type { AnyRecordType } from '@/db/RecordType';
import useObservable from '@/hooks/useObservable';

/**
 * Calls get$ on a database given the filter and returns a state const with the
 * latest result, or `undefined` prior to the first result.
 *
 * Make sure that you memoize filter if its set so this doesn't keep creating
 * new subscriptions each render.
 */
export default function useCollectionQuery<
	RecordType extends AnyRecordType,
	Record,
>(
	collection: Collection<RecordType, Record>,
	filter?: RecordType['filter'],
): Record[] | undefined {
	const results$ = useMemo(
		() => collection.get$(filter),
		[collection, filter],
	);

	return useObservable(results$);
}
