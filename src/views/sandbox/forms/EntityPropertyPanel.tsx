import { useMemo, useState } from 'react';

import EntityPropertiesForm, {
	Actions,
	Fields,
} from '@/components/forms/EntityProperties/Form';
import type { EntityProperties } from '@/components/forms/EntityProperties/schema';
import {
	applyEntityToInitiativeEntry,
	createGenericRecordFromEntity,
} from '@/components/forms/EntityProperties/translate';
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { DocumentApi } from '@/db/Collection';
import { RamCollection } from '@/db/RamCollection';
import {
	initiativeTableEntryFilter,
	type InitiativeTableEntryRecord,
	initiativeTableEntrySchema,
} from '@/db/record/InitiativeTableEntry';
import useBehaviorSubject from '@/hooks/useBehaviorSubject';

function Page() {
	const db = useMemo(() => {
		const db = new RamCollection<InitiativeTableEntryRecord>(
			'entity',
			initiativeTableEntryFilter,
			initiativeTableEntrySchema,
		);

		return db;
	}, []);

	const [record, setRecord] =
		useState<DocumentApi<InitiativeTableEntryRecord>>();

	const [entity, setEntity] = useState<EntityProperties>();

	const createNewRecord = async (data: EntityProperties) => {
		const newRecord = await db.create(createGenericRecordFromEntity(data));

		setRecord(newRecord);
	};

	const data = useBehaviorSubject(record?.data);

	return (
		<section className="grid grid-cols-2 gap-6 max-h-full items-start">
			<Card className="overflow-hidden h-full">
				<ScrollArea className="h-full">
					<CardHeader>Raw Entity Data</CardHeader>
					<CardContent>
						<code>
							<pre>{JSON.stringify(entity, null, 2)}</pre>
						</code>
					</CardContent>
					<CardHeader>Raw Record Data</CardHeader>
					<CardContent>
						<code>
							<pre>{JSON.stringify(data, null, 2)}</pre>
						</code>
					</CardContent>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			</Card>
			<Card className="overflow-hidden h-full">
				<EntityPropertiesForm
					className="h-full"
					entity={entity}
					onChange={(data) => {
						if (record) applyEntityToInitiativeEntry(record, data);
						else createNewRecord(data);

						setEntity(data);
					}}
				>
					<CardContent className="overflow-hidden h-full">
						<ScrollArea className="h-full">
							<Fields />
							<ScrollBar orientation="vertical" />
						</ScrollArea>
					</CardContent>
					<CardFooter>
						<Actions />
					</CardFooter>
				</EntityPropertiesForm>
			</Card>
		</section>
	);
}

export default Page;
