export type Level = (typeof Logger)[(typeof Logger.Level)[number]];

export default class Logger {
	static readonly TRACE = 0;
	static readonly DEBUG = 1;
	static readonly INFO = 2;
	static readonly WARN = 3;
	static readonly ERROR = 4;

	static Level = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'] as const;

	static default: Logger = new Logger();

	writers: [
		level: Level,
		writer: (
			level: Level,
			message: string,
			context: unknown,
			date: Date,
		) => void,
	][];

	constructor() {
		this.writers = [];
	}

	addWriter(
		level: Level,
		writer: (
			level: Level,
			message: string,
			context: unknown,
			date: Date,
		) => void,
	): void {
		this.writers.push([level, writer]);
	}

	write(level: Level, message: string, context?: unknown): void {
		const date = new Date();
		queueMicrotask(() => {
			for (const [writerLevel, writer] of this.writers) {
				if (writerLevel <= level) {
					try {
						writer(level, message, context, date);
					} catch (error) {
						console.error('Logger writer error:', error);
					}
				}
			}
		});
	}

	trace(message: string, context?: unknown): void {
		this.write(Logger.TRACE, message, context);
	}
	debug(message: string, context?: unknown): void {
		this.write(Logger.DEBUG, message, context);
	}
	info(message: string, context?: unknown): void {
		this.write(Logger.INFO, message, context);
	}
	warn(message: string, context?: unknown): void {
		this.write(Logger.WARN, message, context);
	}
	error(message: string, context?: unknown): void {
		this.write(Logger.ERROR, message, context);
	}

	static write(level: Level, message: string, context?: unknown): void {
		this.default.write(level, message, context);
	}
	static trace(message: string, context?: unknown): void {
		this.default.trace(message, context);
	}
	static debug(message: string, context?: unknown): void {
		this.default.debug(message, context);
	}
	static info(message: string, context?: unknown): void {
		this.default.info(message, context);
	}
	static warn(message: string, context?: unknown): void {
		this.default.warn(message, context);
	}
	static error(message: string, context?: unknown): void {
		this.default.error(message, context);
	}
}

export function consoleWriter(
	level: Level,
	message: string,
	context: unknown,
	date: Date,
): void {
	const levelName = Logger.Level[level];
	const color =
		{
			[Logger.TRACE]: 'color: #888',
			[Logger.DEBUG]: 'color: #66f',
			[Logger.INFO]: 'color: #0a0',
			[Logger.WARN]: 'color: #f80',
			[Logger.ERROR]: 'color: #f00',
		}[level] || 'color: #000';

	const args = [
		`[${date.toISOString()}] [%c${levelName}%c]:`,
		color,
		'',
		message,
		...(context ? [context] : []),
	];

	switch (level) {
		case Logger.TRACE:
			console.trace(...args);
			break;
		case Logger.DEBUG:
			console.debug(...args);
			break;
		case Logger.INFO:
			console.info(...args);
			break;
		case Logger.WARN:
			console.warn(...args);
			break;
		case Logger.ERROR:
			console.error(...args);
			break;
		default:
			console.log(...args);
			break;
	}
}
