interface Creature {
	id: string;
	name: string;
	description: string;
}

interface DmData {
	creatures: Record<string, Creature>;
}

// oxlint-disable-next-line typescript/no-empty-object-type
interface PlayerData extends DmData {}

type SyncOptions =
	| {
			syncAll?: boolean;
			obfuscator?: undefined;
	  }
	| {
			obfuscator: (creature: Creature) => Creature;
			syncAll?: undefined;
	  };

interface PlayerEntry {
	player: Player;
	defaultSyncOptions: SyncOptions;
	syncMapping: Map<string, SyncOptions>;
}

export default class SourceView {
	private data: DmData = {
		creatures: {},
	};
	private players: Map<string, PlayerEntry> = new Map();

	getData() {
		return structuredClone(this.data);
	}

	addPlayer(name: string, syncOptions: SyncOptions) {
		const id = crypto.randomUUID();
		const newPlayer = (() => {
			if (syncOptions.syncAll) {
				return new Player(id, name, structuredClone(this.data));
			} else {
				return new Player(id, name, { creatures: {} });
			}
		})();

		this.players.set(id, {
			player: newPlayer,
			defaultSyncOptions: syncOptions,
			syncMapping: new Map(),
		});

		return newPlayer;
	}

	getPlayerNames() {
		return Array.from(this.players.keys());
	}

	addCreature(creature: Creature) {
		this.data.creatures[creature.id] = creature;

		for (const entry of this.players.values()) {
			this.syncCreatureToPlayer(creature, entry);
		}
	}

	updateCreature(creatureId: string, updates: Partial<Creature>) {
		const creature = this.data.creatures[creatureId];
		if (!creature) {
			throw new Error(`Creature with id ${creatureId} does not exist.`);
		}

		this.data.creatures[creatureId] = { ...creature, ...updates };

		for (const entry of this.players.values()) {
			this.syncCreatureToPlayer(this.data.creatures[creatureId], entry);
		}
	}

	private syncCreatureToPlayer(creature: Creature, entry: PlayerEntry) {
		const { player, defaultSyncOptions, syncMapping } = entry;
		const effectiveSyncOptions = syncMapping.get(creature.id) ?? defaultSyncOptions;

		if (effectiveSyncOptions.syncAll) {
			player.acceptNewData(this.data);
		} else if (effectiveSyncOptions.obfuscator) {
			const obfuscatedCreature = effectiveSyncOptions.obfuscator(creature);
			const playerData = player.getData();
			playerData.creatures[creature.id] = obfuscatedCreature;
			player.acceptNewData(playerData);
		}
	}

	publishCreature(creatureId: string, playerId: string, syncOptions: SyncOptions) {
		const creature = this.data.creatures[creatureId];
		if (!creature) {
			throw new Error(`Creature with id ${creatureId} does not exist.`);
		}

		const playerEntry = this.players.get(playerId);
		if (!playerEntry) {
			throw new Error(`Player with id ${playerId} does not exist.`);
		}

		playerEntry.syncMapping.set(creatureId, syncOptions);

		this.syncCreatureToPlayer(creature, playerEntry);
	}
}

export class Player {
	constructor(
		public readonly id: string,
		private name: string,
		private data: PlayerData,
	) {}

	getData() {
		return structuredClone(this.data);
	}

	acceptNewData(newData: PlayerData) {
		this.data = structuredClone(newData);
	}
}
