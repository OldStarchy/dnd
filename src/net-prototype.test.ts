// oxlint-disable typescript/no-non-null-assertion
import { describe, expect, test } from 'vitest';
import * as Y from 'yjs';

// Helper utilities to transform binary Yjs updates into strings for your Store
const fromUint8Array = (buf: Uint8Array) => BSTR.fromUint8Array(buf);
const toUint8Array = (str: string) => BSTR.toUint8Array(str);

// Binary-to-string encoding utility to safely store Uint8Arrays in plain objects
const BSTR = {
	fromUint8Array: (buf: Uint8Array) =>
		Array.from(buf, (byte) => String.fromCharCode(byte)).join(''),
	toUint8Array: (str: string) => Uint8Array.from(str, (char) => char.charCodeAt(0)),
};

class Store {
	private readonly data: Record<string, string> = {};
	readonly notify = new Set<(key: string) => void>();

	set(key: string, value: string) {
		this.data[key] = value;
		this.notify.forEach((callback) => callback(key));
	}

	get(key: string) {
		return this.data[key];
	}

	on(callback: (key: string) => void): () => void {
		this.notify.add(callback);
		return () => this.notify.delete(callback);
	}
}

class UA<T extends object> {
	readonly storage = new Store();

	constructor(private readonly onCreateTab: (tab: Tab<T>) => void) {}

	createTab() {
		const tab = new Tab<T>(this);
		this.onCreateTab(tab);
		return tab;
	}
}

class Tab<T extends object> {
	ua: UA<T>;
	data: Partial<T> = {};

	constructor(ua: UA<T>) {
		this.ua = ua;
	}

	get storage() {
		return this.ua.storage;
	}
}

interface DmData {
	value: string;
}
interface PlayerData {
	value?: string;
}

class DmDataDoc implements DmData {
	private doc: Y.Doc;

	private get map() {
		return this.doc.getMap<unknown>();
	}

	constructor(value: string) {
		this.doc = new Y.Doc();
		this.map.set('value', value);
	}

	get yDoc() {
		return this.doc;
	}

	get yMap() {
		return this.map;
	}

	get value(): string {
		const text = this.map.get('value');
		if (typeof text === 'string') return text;
		throw new Error("Expected 'value' to be a string or undefined");
	}

	set value(newValue: string) {
		this.map.set('value', newValue);
	}
}

class PlayerDataDoc implements PlayerData {
	private doc: Y.Doc;

	private get map() {
		return this.doc.getMap<unknown>();
	}
	constructor() {
		this.doc = new Y.Doc();
	}

	get yDoc() {
		return this.doc;
	}

	get value(): string | undefined {
		const text = this.map.get('value');
		if (text === undefined || typeof text === 'string') return text;
		throw new Error("Expected 'value' to be a string or undefined");
	}

	set value(newValue: string | undefined) {
		this.map.set('value', newValue);
	}
}

interface DmState {
	sourceDoc: DmDataDoc;
	players: Record<
		string,
		{
			id: string;
			view: PlayerDataDoc;
			overlay: PlayerDataDoc;
			changeRequests: { id: string; change: PlayerDataDoc }[];
		}
	>;
}

interface PlayerState {
	playerId: string;
	view: PlayerDataDoc;
	overlay: PlayerDataDoc;
	changeRequests: { id: string; overlay: PlayerDataDoc }[];
}

/**
 * Binds a target Y.Doc to a specific key in your simulated central Store.
 * This simulates how local storage or an offline database updates reactively.
 */
function bindDocToStore(doc: Y.Doc, store: Store, storeKey: string) {
	// 1. Initialise the document if data already exists in storage
	const initialData = store.get(storeKey);
	if (initialData) {
		Y.applyUpdate(doc, toUint8Array(initialData));
	}

	// 2. Save updates to storage when local document mutations occur
	doc.on('update', (update) => {
		const currentDataStr = store.get(storeKey);
		let mergedUpdate = update;

		if (currentDataStr) {
			// Merge updates to preserve entire history vector if key exists
			mergedUpdate = Y.mergeUpdates([toUint8Array(currentDataStr), update]);
		}

		// Write back to storage (bypassing the observer to avoid infinite loops)
		store.set(storeKey, fromUint8Array(mergedUpdate));
	});

	// 3. React to updates written to storage from elsewhere (cross-tab sync)
	store.on((changedKey) => {
		if (changedKey === storeKey) {
			const updatedData = store.get(storeKey);
			if (updatedData) {
				Y.applyUpdate(doc, toUint8Array(updatedData));
			}
		}
	});
}

describe('test', () => {
	test('arch', () => {
		// DM Simulation Setup
		const Dm = new UA<DmState>((tab) => {
			tab.data.sourceDoc = new DmDataDoc('Hello World');

			const p1View = new PlayerDataDoc();
			const p1Overlay = new PlayerDataDoc();

			// Bind the Yjs models to storage keys inside onCreateTab
			bindDocToStore(p1View.yDoc, tab.storage, 'player-1:view');
			bindDocToStore(p1Overlay.yDoc, tab.storage, 'player-1:overlay');

			tab.data.players = {
				'player-1': {
					id: 'player-1',
					view: p1View,
					overlay: p1Overlay,
					changeRequests: [],
				},
			};
		});

		const DmTab1 = Dm.createTab();

		// Player Simulation Setup
		const player1 = new UA<PlayerState>((tab) => {
			tab.data.playerId = 'player-1';
			tab.data.view = new PlayerDataDoc();
			tab.data.overlay = new PlayerDataDoc();

			// Bind player instances to the matching storage keys
			bindDocToStore(tab.data.view.yDoc, tab.storage, 'player-1:view');
			bindDocToStore(tab.data.overlay.yDoc, tab.storage, 'player-1:overlay');
		});

		const player1Tab1 = player1.createTab();

		DmTab1.data.players!['player-1'].view.yDoc.on('update', (update) => {
			Y.applyUpdate(player1Tab1.data.view!.yDoc, update);
		});

		// Test: Mutating the DM's view changes the Player's state over the storage bridge
		DmTab1.data.players!['player-1'].view.value = 'Updated Map Value!';

		// Assertion passes because storage synchronization happens completely synchronously
		expect(player1Tab1.data.view!.value).toBe('Updated Map Value!');

		const player1Tab2 = player1.createTab();

		// Test: A new Player tab correctly initializes from existing storage state
		expect(player1Tab2.data.view!.value).toBe('Updated Map Value!');
	});
});
