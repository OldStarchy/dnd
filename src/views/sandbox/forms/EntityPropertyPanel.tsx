import EntityPropertiesForm, {
	Actions,
	Fields,
} from '@/components/forms/EntityProperties/Form';
import type { EntityProperties } from '@/components/forms/EntityProperties/schema';
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { DocumentApi } from '@/db/Collection';
import { RamCollection } from '@/db/RamCollection';
import type { Encounter } from '@/db/record/Encounter';
import {
	initiativeTableEntryFilter,
	initiativeTableEntrySchema,
	type InitiativeTableEntryRecord,
} from '@/db/record/InitiativeTableEntry';
import useBehaviorSubject from '@/hooks/useBehaviorSubject';
import {
	getObfuscatedHealthText,
	HealthObfuscation,
} from '@/store/types/Entity';
import { useMemo, useState } from 'react';

function toEntity(
	data: InitiativeTableEntryRecord['record'],
): EntityProperties {
	if (data.creature.type !== 'generic') {
		throw new Error('Only generic entities are supported');
	}

	return {
		name: data.creature.data.name,
		initiative: data.initiative,
		images: data.creature.data.images,
		visible: data.effect !== 'invisible',
		ac: data.creature.data.ac,
		hp: data.creature.data.hp,
		maxHp: data.creature.data.maxHp,
		obfuscateHealth: HealthObfuscation.NO,
		debuffs: data.creature.data.debuffs,
	};
}

async function applyEntityToInitiativeEntry(
	record: DocumentApi<InitiativeTableEntryRecord>,
	data: EntityProperties,
) {
	if (record.data.value.creature.type !== 'generic') {
		throw new Error('Only generic entities are supported');
	}

	await record.update({
		replace: {
			encounterId: '' as Encounter['id'],
			healthDisplay: getObfuscatedHealthText(
				data.hp,
				data.maxHp,
				data.obfuscateHealth,
			),
			creature: {
				type: 'generic',
				data: {
					name: data.name,
					images: data.images ?? [],
					hp: data.hp,
					maxHp: data.maxHp,
					debuffs: data.debuffs,
				},
			},
			initiative: data.initiative,
			effect: data.visible ? undefined : 'invisible',
		},
	});
}

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
		const newRecord = await db.create({
			encounterId: '' as Encounter['id'],
			healthDisplay: getObfuscatedHealthText(
				data.hp,
				data.maxHp,
				data.obfuscateHealth,
			),
			creature: {
				type: 'generic',
				data: {
					name: data.name,
					images: data.images ?? [],
					hp: data.hp,
					maxHp: data.maxHp,
					debuffs: data.debuffs,
				},
			},
			initiative: data.initiative,
			effect: data.visible ? undefined : 'invisible',
		});

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
					entity={record && toEntity(record.data.value)}
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
