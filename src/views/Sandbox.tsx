import CreatureForm from '@/components/CreatureForm';
import sybilProfile from '@/components/InitiativeTable/fixtures/sybil_profile.png';
import type { InitiativeTableEntry } from '@/components/InitiativeTable/InitiativeTableEntry';
import { Debuff } from '@/type/Debuff';

function Sandbox() {
	const creature: InitiativeTableEntry[] = [
		{
			id: '1',
			name: 'Battle Pants',
			race: 'Human',
			initiative: 15,
			healthDisplay: 'Healthy',
			debuffs: [],
			effect: undefined,
		},
		{
			id: '2',
			name: 'Sybil Snow',
			race: 'Human',
			initiative: 15,
			healthDisplay: 'Healthy',
			debuffs: [Debuff.poisoned],
			effect: undefined,
			description:
				'Sybil is a skilled Bladesinger with a determened personality and a hidden past. Attuned to both swordplay and magic, she carries an arcane focus in the form of a ring set with a pearlescent opal.',
			images: [sybilProfile],
		},
	];

	return (
		<>
			{/* <InitiativeTable entries={creature} /> */}
			<CreatureForm onSubmit={() => {}} />
		</>
	);
}

export default Sandbox;
