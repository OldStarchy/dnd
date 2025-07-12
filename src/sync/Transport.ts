export interface TransportHandler<
	TData = string,
	TTransport extends Transport<TData> = Transport<TData>,
> {
	handleMessage(this: TTransport, data: TData): void;
	handleClose(this: TTransport): void;
	handleOpen(this: TTransport): void;
}

export interface Transport<TData = string> {
	send(data: TData): Promise<void>;
	close(): void;
	isOpen(): boolean;
	[Symbol.dispose](): void;
}

export type TransportFactory<TData = string> = (
	handler: TransportHandler<TData>,
) => Transport<TData>;
