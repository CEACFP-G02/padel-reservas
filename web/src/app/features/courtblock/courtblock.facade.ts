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
    // TODO: api.list(courtId, date) -> _blocks — see docs/api.md#court-blocks-maintenance--apiv1courtsidblocks
    todo('CourtBlockFacade.listBlocks', 'court-blocks-maintenance--apiv1courtsidblocks');
  }

  /** UC: Create block. */
  async createBlock(courtId: number, request: CourtBlockRequest): Promise<void> {
    // TODO: api.create(courtId, request) -> append to _blocks
    //  — see docs/api.md#court-blocks-maintenance--apiv1courtsidblocks
    todo('CourtBlockFacade.createBlock', 'court-blocks-maintenance--apiv1courtsidblocks');
  }

  /** UC: Remove block. */
  async removeBlock(id: number): Promise<void> {
    // TODO: api.remove(id) -> drop from _blocks — see docs/api.md#court-blocks-maintenance--apiv1courtsidblocks
    todo('CourtBlockFacade.removeBlock', 'court-blocks-maintenance--apiv1courtsidblocks');
  }
}
