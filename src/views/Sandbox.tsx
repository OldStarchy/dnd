import sybilProfile from '@/components/InitiativeTable/fixtures/sybil_profile.png';
import InitiativeTable from '@/components/InitiativeTable/InitiativeTable';
import type {InitiativeTableEntry} from '@/components/InitiativeTable/InitiativeTableRow';
import {Debuff} from '@/type/Debuff';

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
			debuffs: [Debuff.of('poisoned')],
			effect: undefined,
			description:
				'Sybil is a skilled Bladesinger with a determened personality and a hidden past. Attuned to both swordplay and magic, she carries an arcane focus in the form of a ring set with a pearlescent opal.',
			image: sybilProfile,
		},
	];

	return (
		<>
			<InitiativeTable entries={creature} />
		</>
	);
}

export default Sandbox;
