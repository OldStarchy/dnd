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
import { RamCollection } from '@/db/RamCollection';
import {
	InitiativeTableEntryCollectionSchema,
	type InitiativeTableEntryRecord,
} from '@/db/record/InitiativeTableEntry';
import useBehaviorSubject from '@/hooks/useBehaviorSubject';
import { Db, type DndDb } from '@/sync/room/RoomApi';
import type { InitiativeTableEntryApi } from '@/type/EncounterApi';

function Page() {
	const collection = useMemo(() => {
		const db: DndDb = new Db();

		db.register(
			'initiativeTableEntry',
			(db) =>
				new RamCollection<
					InitiativeTableEntryRecord,
					InitiativeTableEntryApi
				>(InitiativeTableEntryCollectionSchema, db),
		);

		return db.get('initiativeTableEntry');
	}, []);

	const [record, setRecord] = useState<InitiativeTableEntryApi>();

	const [entity, setEntity] = useState<EntityProperties>();

	const createNewRecord = async (data: EntityProperties) => {
		const newRecord = await collection.create(
			createGenericRecordFromEntity(data),
		);

		setRecord(newRecord);
	};

	const data = useBehaviorSubject(record?.data$);

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
