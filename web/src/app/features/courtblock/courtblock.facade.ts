import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiError, BlockRange, CourtBlock, CourtBlockRequest } from '../../shared/models';
import { CourtBlockApi } from './courtblock.api';

export type BlockField = 'date' | 'start' | 'end' | 'reason';

/** A failed block write, with Spanish messages for the form. */
export class CourtBlockError extends Error {
  constructor(
    message: string,
    readonly fieldErrors: Partial<Record<BlockField, string>> = {},
  ) {
    super(message);
  }
}

export const END_AFTER_START = 'La hora de fin debe ser posterior a la de inicio.';
export const BLOCK_IN_THE_PAST = 'Ese bloqueo ya ha terminado. Elige una fecha y hora futuras.';

const FIELD_MESSAGES: Record<BlockField, string> = {
  date: 'Indica la fecha.',
  start: 'Indica la hora de inicio.',
  end: 'Indica la hora de fin.',
  reason: 'El motivo admite como máximo 255 caracteres.',
};

const OVERLAP = /overlaps booking (\d+) \((\d{2}:\d{2})-(\d{2}:\d{2})\)/;

/** Maps the documented create errors (docs/api.md#court-blocks-maintenance--apiv1courtsidblocks) to Spanish. */
function createErrorOf(error: unknown): CourtBlockError {
  const status = error instanceof HttpErrorResponse ? error.status : undefined;
  const body = status ? ((error as HttpErrorResponse).error as ApiError | null) : null;
  const message = body?.message ?? '';
  if (status === 409) {
    const overlap = OVERLAP.exec(message);
    return new CourtBlockError(
      overlap
        ? `Coincide con la reserva ${overlap[1]} (${overlap[2]}–${overlap[3]}). Cancélala o cámbiala de hora antes de bloquear.`
        : 'El bloqueo coincide con una reserva confirmada. Cancélala o cámbiala de hora antes de bloquear.',
    );
  }
  if (status === 400) {
    if (message === 'Block end must be after its start') {
      return new CourtBlockError('Revisa los datos del bloqueo.', { end: END_AFTER_START });
    }
    if (message.endsWith('is in the past')) {
      return new CourtBlockError(BLOCK_IN_THE_PAST);
    }
    const fieldErrors = Object.fromEntries(
      Object.keys(body?.fieldErrors ?? {})
        .filter((field): field is BlockField => field in FIELD_MESSAGES)
        .map((field) => [field, FIELD_MESSAGES[field]]),
    );
    return new CourtBlockError('Revisa los datos del bloqueo.', fieldErrors);
  }
  if (status === 404) {
    return new CourtBlockError('La pista ya no existe.');
  }
  return new CourtBlockError('No se pudo crear el bloqueo.');
}

const byDateAndStart = (a: CourtBlock, b: CourtBlock) =>
  a.date.localeCompare(b.date) || a.start.localeCompare(b.start) || a.id - b.id;

/** OWNER use cases on court blocks (maintenance, tournaments…). */
@Injectable({ providedIn: 'root' })
export class CourtBlockFacade {
  private readonly api = inject(CourtBlockApi);

  private readonly _blocks = signal<CourtBlock[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private last: { courtId: number; range: BlockRange } | null = null;

  readonly blocks = this._blocks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** UC: List blocks of a court (optional inclusive date range), by date and start. */
  async listBlocks(courtId: number, range: BlockRange = {}): Promise<void> {
    this.last = { courtId, range };
    this._loading.set(true);
    this._error.set(null);
    try {
      this._blocks.set(await firstValueFrom(this.api.list(courtId, range)));
    } catch {
      this._blocks.set([]);
      this._error.set('No se pudieron cargar los bloqueos.');
    } finally {
      this._loading.set(false);
    }
  }

  /** Reloads the last listed court and range. */
  refresh(): Promise<void> {
    return this.last ? this.listBlocks(this.last.courtId, this.last.range) : Promise.resolve();
  }

  /** UC: Create block. Rejects with a {@link CourtBlockError} (409 = it covers a confirmed booking). */
  async createBlock(courtId: number, request: CourtBlockRequest): Promise<CourtBlock> {
    let block: CourtBlock;
    try {
      block = await firstValueFrom(this.api.create(courtId, request));
    } catch (error) {
      throw createErrorOf(error);
    }
    this._blocks.update((blocks) => [...blocks, block].sort(byDateAndStart));
    return block;
  }

  /** UC: Remove block. Rejects with a {@link CourtBlockError}. */
  async removeBlock(id: number): Promise<void> {
    try {
      await firstValueFrom(this.api.remove(id));
    } catch (error) {
      throw new CourtBlockError(
        error instanceof HttpErrorResponse && error.status === 404
          ? 'El bloqueo ya no existe.'
          : 'No se pudo quitar el bloqueo.',
      );
    }
    this._blocks.update((blocks) => blocks.filter((block) => block.id !== id));
  }
}
