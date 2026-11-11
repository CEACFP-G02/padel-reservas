import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { Court, CourtType } from '../../../shared/models';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/ui/confirm-dialog/confirm.dialog';
import { COURT_TYPE_LABELS } from '../court-labels';
import { CourtError, CourtFacade } from '../court.facade';
import { CourtFormDialog } from './court-form.dialog';

const SNACK_DURATION = { duration: 4000 };

@Component({
  selector: 'app-court-list-page',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatTooltipModule,
    RouterLink,
  ],
  template: `
    <header class="page-header">
      <h1>Pistas</h1>
      <span class="spacer"></span>
      <button matButton (click)="facade.refresh()" data-testid="refresh">
        <mat-icon>refresh</mat-icon> Actualizar
      </button>
      <button matButton="filled" (click)="openCreate()" data-testid="create">
        <mat-icon>add</mat-icon> Nueva pista
      </button>
    </header>

    @if (facade.loading()) {
      <mat-progress-bar mode="indeterminate" />
    }
    @if (facade.error(); as error) {
      <p class="error" role="alert" data-testid="list-error">{{ error }}</p>
    }

    <table mat-table [dataSource]="facade.courts()">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Nombre</th>
        <td mat-cell *matCellDef="let court">
          <a [routerLink]="[court.id]">{{ court.name }}</a>
        </td>
      </ng-container>
      <ng-container matColumnDef="type">
        <th mat-header-cell *matHeaderCellDef>Tipo</th>
        <td mat-cell *matCellDef="let court">{{ typeLabel(court.type) }}</td>
      </ng-container>
      <ng-container matColumnDef="indoor">
        <th mat-header-cell *matHeaderCellDef>Cubierta / exterior</th>
        <td mat-cell *matCellDef="let court">{{ court.indoor ? 'Cubierta' : 'Exterior' }}</td>
      </ng-container>
      <ng-container matColumnDef="active">
        <th mat-header-cell *matHeaderCellDef>Estado</th>
        <td mat-cell *matCellDef="let court" [class.inactive]="!court.active">
          {{ court.active ? 'Activa' : 'Inactiva' }}
        </td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef><span class="cdk-visually-hidden">Acciones</span></th>
        <td mat-cell *matCellDef="let court">
          <a
            matIconButton
            [routerLink]="['/courts', court.id, 'schedule']"
            data-testid="schedule"
            aria-label="Horario"
            matTooltip="Horario"
          >
            <mat-icon>schedule</mat-icon>
          </a>
          <a
            matIconButton
            [routerLink]="['/courts', court.id, 'blocks']"
            data-testid="blocks"
            aria-label="Bloqueos"
            matTooltip="Bloqueos"
          >
            <mat-icon>event_busy</mat-icon>
          </a>
          <button
            matIconButton
            (click)="openEdit(court)"
            data-testid="edit"
            aria-label="Editar"
            matTooltip="Editar"
          >
            <mat-icon>edit</mat-icon>
          </button>
          <button
            matIconButton
            (click)="deactivate(court)"
            [disabled]="!court.active"
            data-testid="deactivate"
            aria-label="Desactivar"
            matTooltip="Desactivar"
          >
            <mat-icon>block</mat-icon>
          </button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns" data-testid="court-row"></tr>
      <tr class="mat-mdc-row" *matNoDataRow>
        <td class="mat-mdc-cell empty" [attr.colspan]="columns.length">
          {{ facade.loading() ? 'Cargando pistas…' : 'Todavía no hay pistas.' }}
        </td>
      </tr>
    </table>
    <mat-paginator
      [length]="facade.page()?.totalElements ?? 0"
      [pageIndex]="facade.page()?.page ?? 0"
      [pageSize]="facade.page()?.size ?? 20"
      [pageSizeOptions]="[10, 20, 50]"
      (page)="changePage($event)"
    />
  `,
  styles: `
    .page-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .spacer {
      flex: 1;
    }
    .error {
      color: var(--mat-sys-error);
    }
    .inactive {
      color: var(--mat-sys-on-surface-variant);
      font-style: italic;
    }
    .empty {
      padding: 16px;
    }
  `,
})
export class CourtListPage {
  protected readonly facade = inject(CourtFacade);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly columns = ['name', 'type', 'indoor', 'active', 'actions'];

  constructor() {
    void this.facade.listCourts();
  }

  protected typeLabel(type: CourtType): string {
    return COURT_TYPE_LABELS[type];
  }

  protected changePage(event: PageEvent): void {
    void this.facade.listCourts({ page: event.pageIndex, size: event.pageSize });
  }

  protected openCreate(): void {
    this.openForm(null, (court) => `Pista «${court.name}» creada.`);
  }

  protected openEdit(court: Court): void {
    this.openForm(court, (saved) => `Pista «${saved.name}» actualizada.`);
  }

  protected deactivate(court: Court): void {
    const data: ConfirmDialogData = {
      title: 'Desactivar pista',
      message: `La pista «${court.name}» dejará de admitir reservas. Sus reservas y su horario se conservan.`,
      confirmLabel: 'Desactivar',
    };
    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data })
      .afterClosed()
      .subscribe(async (confirmed) => {
        if (!confirmed) {
          return;
        }
        try {
          await this.facade.deactivateCourt(court.id);
          this.notify(`Pista «${court.name}» desactivada.`);
        } catch (error) {
          this.notify(
            error instanceof CourtError ? error.message : 'No se pudo desactivar la pista.',
          );
        }
        await this.facade.refresh();
      });
  }

  private openForm(court: Court | null, success: (saved: Court) => string): void {
    this.dialog
      .open<CourtFormDialog, Court | null, Court>(CourtFormDialog, { data: court })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.notify(success(saved));
          void this.facade.refresh();
        }
      });
  }

  private notify(message: string): void {
    this.snackBar.open(message, 'OK', SNACK_DURATION);
  }
}
