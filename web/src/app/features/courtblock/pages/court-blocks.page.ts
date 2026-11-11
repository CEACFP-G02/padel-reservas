import { DatePipe, formatDate } from '@angular/common';
import {
  Component,
  LOCALE_ID,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { CourtBlock } from '../../../shared/models';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/ui/confirm-dialog/confirm.dialog';
import { toIsoDate } from '../../../shared/util/date';
import { CourtFacade } from '../../court/court.facade';
import { CourtBlockError, CourtBlockFacade } from '../courtblock.facade';
import { BlockFormDialog, BlockFormDialogData } from './block-form.dialog';

const SNACK_DURATION = { duration: 4000 };

/** Maintenance blocks of one court: list (upcoming, or all), add and remove. */
@Component({
  selector: 'app-court-blocks-page',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    RouterLink,
    DatePipe,
  ],
  template: `
    <header class="page-header">
      <a matIconButton routerLink="/courts" aria-label="Volver a pistas"
        ><mat-icon>arrow_back</mat-icon></a
      >
      <h1>Bloqueos · {{ courtName() }}</h1>
      <span class="spacer"></span>
      <button matButton="filled" (click)="openCreate()" data-testid="create">
        <mat-icon>block</mat-icon> Nuevo bloqueo
      </button>
    </header>

    <mat-checkbox
      data-testid="show-past"
      [checked]="showPast()"
      (change)="showPast.set($event.checked)"
    >
      Mostrar también los pasados
    </mat-checkbox>

    @if (facade.loading()) {
      <mat-progress-bar mode="indeterminate" />
    }
    @if (facade.error(); as error) {
      <p class="error" role="alert" data-testid="list-error">{{ error }}</p>
    }

    <div class="table-card">
      <table mat-table [dataSource]="facade.blocks()">
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Fecha</th>
          <td mat-cell *matCellDef="let block" class="date">{{ block.date | date: 'fullDate' }}</td>
        </ng-container>
        <ng-container matColumnDef="range">
          <th mat-header-cell *matHeaderCellDef>Horario</th>
          <td mat-cell *matCellDef="let block">{{ block.start }} – {{ block.end }}</td>
        </ng-container>
        <ng-container matColumnDef="reason">
          <th mat-header-cell *matHeaderCellDef>Motivo</th>
          <td mat-cell *matCellDef="let block">{{ block.reason ?? '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>
            <span class="cdk-visually-hidden">Acciones</span>
          </th>
          <td mat-cell *matCellDef="let block">
            <button
              matIconButton
              (click)="remove(block)"
              data-testid="remove"
              aria-label="Quitar bloqueo"
              matTooltip="Quitar bloqueo"
            >
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns" data-testid="block-row"></tr>
        <tr class="mat-mdc-row" *matNoDataRow>
          <td class="mat-mdc-cell empty" [attr.colspan]="columns.length">
            {{
              facade.loading()
                ? 'Cargando bloqueos…'
                : showPast()
                  ? 'No hay bloqueos.'
                  : 'No hay bloqueos próximos.'
            }}
          </td>
        </tr>
      </table>
    </div>
  `,
  styles: `
    .date::first-letter {
      text-transform: uppercase;
    }
  `,
})
export class CourtBlocksPage {
  protected readonly facade = inject(CourtBlockFacade);
  private readonly courts = inject(CourtFacade);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly locale = inject(LOCALE_ID);
  readonly courtId = input.required({ transform: numberAttribute });
  protected readonly columns = ['date', 'range', 'reason', 'actions'];
  protected readonly showPast = signal(false);

  protected readonly courtName = computed(() => {
    const court = this.courts.selected();
    return court?.id === this.courtId() ? court.name : `Pista ${this.courtId()}`;
  });

  constructor() {
    effect(() => {
      const courtId = this.courtId();
      untracked(() => void this.courts.getCourt(courtId).catch(() => undefined));
    });
    effect(() => {
      const courtId = this.courtId();
      const range = this.showPast() ? {} : { from: toIsoDate(new Date()) };
      untracked(() => void this.facade.listBlocks(courtId, range));
    });
  }

  protected openCreate(): void {
    const data: BlockFormDialogData = { courtId: this.courtId(), courtName: this.courtName() };
    this.dialog
      .open<BlockFormDialog, BlockFormDialogData, CourtBlock>(BlockFormDialog, { data })
      .afterClosed()
      .subscribe((block) => {
        if (block) {
          this.notify('Bloqueo creado.');
          void this.facade.refresh();
        }
      });
  }

  protected remove(block: CourtBlock): void {
    const data: ConfirmDialogData = {
      title: 'Quitar bloqueo',
      message: `Se quitará el bloqueo del ${formatDate(block.date, 'fullDate', this.locale)} (${block.start} – ${block.end}) y esos turnos volverán a estar disponibles.`,
      confirmLabel: 'Quitar',
    };
    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data })
      .afterClosed()
      .subscribe(async (confirmed) => {
        if (!confirmed) {
          return;
        }
        try {
          await this.facade.removeBlock(block.id);
          this.notify('Bloqueo quitado.');
        } catch (error) {
          this.notify(
            error instanceof CourtBlockError ? error.message : 'No se pudo quitar el bloqueo.',
          );
        }
        await this.facade.refresh();
      });
  }

  private notify(message: string): void {
    this.snackBar.open(message, 'OK', SNACK_DURATION);
  }
}
