import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import {
  ApiError,
  Court,
  CourtFilters,
  CourtRequest,
  PageMeta,
  UpdateCourtRequest,
} from '../../shared/models';
import { CourtApi } from './court.api';

export type CourtField = 'name' | 'type' | 'indoor' | 'active';

/** A failed court write, with Spanish messages for the form. */
export class CourtError extends Error {
  constructor(
    message: string,
    readonly fieldErrors: Partial<Record<CourtField, string>> = {},
  ) {
    super(message);
  }
}

const DUPLICATE_NAME = 'Ya existe una pista con ese nombre.';

const FIELD_MESSAGES: Record<CourtField, string> = {
  name: 'El nombre es obligatorio (máximo 100 caracteres).',
  type: 'Elige el tipo de pista.',
  indoor: 'Indica si la pista es cubierta o exterior.',
  active: 'Indica si la pista está activa.',
};

/** Maps the documented errors (docs/api.md#courts--apiv1courts) to Spanish. */
function courtErrorOf(error: unknown): CourtError {
  const status = error instanceof HttpErrorResponse ? error.status : undefined;
  if (status === 409) {
    return new CourtError(DUPLICATE_NAME, { name: DUPLICATE_NAME });
  }
  if (status === 404) {
    return new CourtError('La pista ya no existe.');
  }
  if (status === 400) {
    const apiFields = ((error as HttpErrorResponse).error as ApiError | null)?.fieldErrors ?? {};
    const fieldErrors = Object.fromEntries(
      Object.keys(apiFields)
        .filter((field): field is CourtField => field in FIELD_MESSAGES)
        .map((field) => [field, FIELD_MESSAGES[field]]),
    );
    return new CourtError('Revisa los datos de la pista.', fieldErrors);
  }
  return new CourtError('No se pudo guardar la pista.');
}

/** OWNER use cases on courts. One method per use case; state lives in signals. */
@Injectable({ providedIn: 'root' })
export class CourtFacade {
  private readonly api = inject(CourtApi);

  private readonly _courts = signal<Court[]>([]);
  private readonly _page = signal<PageMeta | null>(null);
  private readonly _selected = signal<Court | null>(null);
  private readonly _filters = signal<CourtFilters>({});
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly courts = this._courts.asReadonly();
  readonly page = this._page.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly activeCourts = computed(() => this._courts().filter((court) => court.active));

  /** UC: List courts (type/active filters + pagination). OWNER sees active and inactive courts. */
  async listCourts(filters: CourtFilters = {}): Promise<void> {
    this._filters.set(filters);
    this._loading.set(true);
    this._error.set(null);
    try {
      const { content, ...meta } = await firstValueFrom(this.api.list(filters));
      this._courts.set(content);
      this._page.set(meta);
    } catch {
      this._courts.set([]);
      this._page.set(null);
      this._error.set('No se pudieron cargar las pistas.');
    } finally {
      this._loading.set(false);
    }
  }

  /** Reloads the list with the last filters. */
  refresh(): Promise<void> {
    return this.listCourts(this._filters());
  }

  /** UC: Get court. */
  async getCourt(id: number): Promise<void> {
    this._selected.set(await firstValueFrom(this.api.get(id)));
  }

  /** UC: Create court. Rejects with a {@link CourtError}. */
  async createCourt(request: CourtRequest): Promise<Court> {
    const court = await this.write(this.api.create(request));
    this._courts.update((courts) => [...courts, court]);
    return court;
  }

  /** UC: Update court (PATCH: only the changed fields). Rejects with a {@link CourtError}. */
  async updateCourt(id: number, request: UpdateCourtRequest): Promise<Court> {
    const court = await this.write(this.api.update(id, request));
    this.replace(court);
    return court;
  }

  /** UC: Deactivate court (DELETE, soft). Rejects with a {@link CourtError}. */
  async deactivateCourt(id: number): Promise<void> {
    await this.write(this.api.deactivate(id));
    const court = this._courts().find((c) => c.id === id);
    if (court) {
      this.replace({ ...court, active: false });
    }
  }

  private async write<T>(request: Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(request);
    } catch (error) {
      throw courtErrorOf(error);
    }
  }

  private replace(court: Court): void {
    this._courts.update((courts) => courts.map((c) => (c.id === court.id ? court : c)));
    if (this._selected()?.id === court.id) {
      this._selected.set(court);
    }
  }
}
