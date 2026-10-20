import { Injectable, inject, signal } from '@angular/core';

import { CourtBlock, CourtBlockRequest, IsoDate } from '../../shared/models';
import { todo } from '../../shared/util/todo';
import { CourtBlockApi } from './courtblock.api';

/** OWNER use cases on court blocks (maintenance, tournaments…). */
@Injectable({ providedIn: 'root' })
export class CourtBlockFacade {
  private readonly api = inject(CourtBlockApi);

  private readonly _blocks = signal<CourtBlock[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly blocks = this._blocks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** UC: List blocks. */
  async listBlocks(courtId: number, date?: IsoDate): Promise<void> {
    // TODO: api.list(courtId, date) -> _blocks — see docs/api.md#get-apiv1courtscourtidblocks
    todo('CourtBlockFacade.listBlocks', 'get-apiv1courtscourtidblocks');
  }

  /** UC: Create block. */
  async createBlock(courtId: number, request: CourtBlockRequest): Promise<void> {
    // TODO: api.create(courtId, request) -> append to _blocks — see docs/api.md#post-apiv1courtscourtidblocks
    todo('CourtBlockFacade.createBlock', 'post-apiv1courtscourtidblocks');
  }

  /** UC: Remove block. */
  async removeBlock(courtId: number, blockId: number): Promise<void> {
    // TODO: api.remove(courtId, blockId) -> drop from _blocks — see docs/api.md#delete-apiv1courtscourtidblocksblockid
    todo('CourtBlockFacade.removeBlock', 'delete-apiv1courtscourtidblocksblockid');
  }
}
