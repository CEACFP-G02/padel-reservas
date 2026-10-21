import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';

import { Court, CourtType } from '../../../shared/models';
import { COURT_TYPE_LABELS } from '../court-labels';
import { CourtFacade } from '../court.facade';
import { CourtFormDialog } from './court-form.dialog';

@Component({
  selector: 'app-court-list-page',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatPaginatorModule, RouterLink],
  template: `
    <header class="page-header">
      <h1>Pistas</h1>
      <button matButton="filled" (click)="openCreate()"><mat-icon>add</mat-icon> Nueva pista</button>
    </header>

    @if (facade.loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <table mat-table [dataSource]="facade.courts()">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Nombre</th>
        <td mat-cell *matCellDef="let court"><a [routerLink]="[court.id]">{{ court.name }}</a></td>
      </ng-container>
      <ng-container matColumnDef="type">
        <th mat-header-cell *matHeaderCellDef>Tipo</th>
        <td mat-cell *matCellDef="let court">{{ typeLabel(court.type) }}</td>
      </ng-container>
      <ng-container matColumnDef="indoor">
        <th mat-header-cell *matHeaderCellDef>Cubierta</th>
        <td mat-cell *matCellDef="let court">{{ court.indoor ? 'Sí' : 'No' }}</td>
      </ng-container>
      <ng-container matColumnDef="active">
        <th mat-header-cell *matHeaderCellDef>Estado</th>
        <td mat-cell *matCellDef="let court">{{ court.active ? 'Activa' : 'Inactiva' }}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let court">
          <button matIconButton (click)="openEdit(court)" aria-label="Editar"><mat-icon>edit</mat-icon></button>
          <button matIconButton (click)="deactivate(court)" [disabled]="!court.active" aria-label="Desactivar">
            <mat-icon>block</mat-icon>
          </button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>
    <mat-paginator
      [length]="facade.page()?.totalElements ?? 0"
      [pageIndex]="facade.page()?.page ?? 0"
      [pageSize]="facade.page()?.size ?? 20"
      [pageSizeOptions]="[10, 20, 50]"
      (page)="changePage($event)"
    />
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
    // TODO: on close with a value -> facade.createCourt(value) + snackbar — see docs/api.md#courts--apiv1courts
    this.dialog.open(CourtFormDialog);
  }

  protected openEdit(court: Court): void {
    // TODO: on close with a value -> facade.updateCourt(court.id, changed fields) — see docs/api.md#courts--apiv1courts
    this.dialog.open(CourtFormDialog, { data: court });
  }

  protected deactivate(court: Court): void {
    // TODO: confirm, then facade.deactivateCourt(court.id) (DELETE, soft) — see docs/api.md#courts--apiv1courts
    this.snackBar.open(`TODO: desactivar ${court.name}`, 'OK', { duration: 3000 });
  }
}
