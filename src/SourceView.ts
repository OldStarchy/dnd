import createId from './createId';
import type CreatureFragment from './docs/CreatureFragment';
import type { Creature } from './docs/CreatureFragment';
import PlayerDoc from './docs/PlayerDoc';

type SyncOptions =
	| {
			syncAll?: boolean;
			obfuscator?: undefined;
	  }
	| {
			obfuscator: (creature: Creature) => Creature;
			syncAll?: undefined;
	  };

/**
 * A "SourceView" (name pending) holds both the DM's source of truth (`data`) and every players view of that data.
 *
 * When players are added, sync options can be set to determine how the player's view of that data is obfuscated.
 */
export default class SourceView {
	public data = new PlayerDoc();
	private playerData: Map<string, Player> = new Map();

	constructor() {
		this.data.creature$.subscribe((deletedIdOrCreature) => {
			if (typeof deletedIdOrCreature === 'string') {
				// creature was deleted
				for (const player of this.playerData.values()) {
					player.data.deleteCreature(deletedIdOrCreature);
				}
			} else {
				// creature was added or updated
				for (const player of this.playerData.values()) {
					this.syncCreatureToPlayer(deletedIdOrCreature, player);
				}
			}
		});
	}

	addPlayer(name: string, syncOptions: SyncOptions) {
		const player = new Player(name, syncOptions);

		this.playerData.set(player.id, player);

		for (const creature of Object.values(this.data.creatures)) {
			this.syncCreatureToPlayer(creature, player);
		}
		if (this.data.encounter) {
			player.data.startEncounter(this.data.encounter.export());
		}

		return player;
	}

	getPlayerNames() {
		return Array.from(this.playerData.values().map((playerData) => playerData.name));
	}

	updateCreature(creatureId: string, updates: Partial<Creature>) {
		const creature = this.data.creatures[creatureId];
		if (!creature) {
			throw new Error(`Creature with id ${creatureId} does not exist.`);
		}

		creature.import({ ...creature.export(), ...updates });
	}

	private syncCreatureToPlayer(creature: CreatureFragment, player: Player) {
		const { defaultSyncOptions, syncMapping } = player;
		const effectiveSyncOptions = syncMapping.get(creature.id) ?? defaultSyncOptions;

		const data = creature.export();

		if (effectiveSyncOptions.syncAll) {
			player.data.publishCreature(data);
		} else if (effectiveSyncOptions.obfuscator) {
			const obfuscatedCreature = effectiveSyncOptions.obfuscator(data);

			player.data.publishCreature(obfuscatedCreature);
		}
	}

	publishCreature(creatureId: string, playerId: string, syncOptions: SyncOptions) {
		const creature = this.data.creatures[creatureId];
		if (!creature) {
			throw new Error(`Creature with id ${creatureId} does not exist.`);
		}

		const player = this.playerData.get(playerId);
		if (!player) {
			throw new Error(`Player with id ${playerId} does not exist.`);
		}

		player.syncMapping.set(creatureId, syncOptions);

		this.syncCreatureToPlayer(creature, player);
	}
}

export class Player {
	public readonly id: string;
	public syncMapping: Map<string, SyncOptions>;
	public readonly data: PlayerDoc;

	constructor(
		public readonly name: string,
		public defaultSyncOptions: SyncOptions,
	) {
		this.id = createId();
		this.syncMapping = new Map();
		this.data = new PlayerDoc();
	}
}
