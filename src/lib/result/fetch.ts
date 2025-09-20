import type z from 'zod';
import { AsyncResult } from '../AsyncResult';
import { Err, Ok, Result, UnknownError, type IntoResultFn } from '../Result';

export type AsyncAndThenOperator<In, Out, Err> = (
	value: In,
) => AsyncResult<Out, Err>;

/**
 * An error thrown by {@link fetch}
 */
export class FetchError extends Error {
	constructor(readonly inner: DOMException | TypeError) {
		super(
			'Error communicating with the server. 1. The server address may be wrong. 2. The server may be offline. 3. You may have lost internet.',
		);
	}
}

/**
 * The server has responded in a non-conformant way
 */
export abstract class ServerResponseError extends Error {
	constructor() {
		super('The server returned an invalid response.');
	}
}

/**
 * A status code not expected by the particular request
 */
export class UnexpectedStatusError extends ServerResponseError {
	constructor(readonly status: number) {
		super();
	}
}

/**
 * The server responded with invalid JSON
 */
export class JsonParseError extends ServerResponseError {
	constructor(readonly inner: SyntaxError) {
		super();
	}
}

/**
 * The server responded with JSON that did not validate against the expected schema
 */
export class ZodValidationError<
	Schema extends z.ZodType,
> extends ServerResponseError {
	constructor(readonly inner: z.ZodError<z.infer<Schema>>) {
		super();
	}
}

export const fetchResult = AsyncResult.wrapFn(fetch, (e: unknown) => {
	if (e instanceof DOMException || e instanceof TypeError) {
		return new FetchError(e);
	}

	return new UnknownError(e);
});

export const responseOk: IntoResultFn<
	Response,
	Response,
	UnexpectedStatusError
> = (response) => {
	if (response.ok) {
		return Ok(response);
	} else {
		return Err(new UnexpectedStatusError(response.status));
	}
};

export function validateJsonResponse<Schema extends z.ZodType>(
	schema: Schema,
): AsyncAndThenOperator<
	Response,
	z.infer<Schema>,
	ServerResponseError | ZodValidationError<Schema> | UnknownError
> {
	return (response: Response) =>
		AsyncResult.wrap(async () => {
			try {
				return Ok(await response.json());
			} catch (e: unknown) {
				if (e instanceof SyntaxError) {
					return Err(new JsonParseError(e));
				}

				return Err(new UnknownError(e));
			}
		}).andThen((data) =>
			Result.zodParse(schema, data).mapErr(
				(e) => new ZodValidationError(e),
			),
		);
}
