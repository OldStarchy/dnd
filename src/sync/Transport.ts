import type { Observable } from 'rxjs';

export interface Transport<TData> {
	send(data: TData): Promise<void>;
	message$: Observable<TData>;
	close(): void;
	isOpen(): boolean;
	[Symbol.dispose](): void;
}
