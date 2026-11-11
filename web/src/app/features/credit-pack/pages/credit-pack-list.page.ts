import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CreditPack } from '../../../shared/models';
import { CreditPackFacade, CreditPackRow } from '../credit-pack.facade';
import { CreditPackFormDialog } from './credit-pack-form.dialog';

const SNACK_DURATION = { duration: 4000 };

@Component({
  selector: 'app-credit-pack-list-page',
  imports: [
    CurrencyPipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  template: `
    <header class="page-header">
      <h1>Packs de crédito</h1>
      <span class="spacer"></span>
      <button matButton="outlined" (click)="facade.refresh()" data-testid="refresh">
        <mat-icon>refresh</mat-icon> Actualizar
      </button>
    </header>
    <p class="muted intro">
      Cada crédito es una reserva prepagada. Los tamaños de los packs son fijos; solo se cambia su
      precio.
    </p>

    @if (facade.loading()) {
      <mat-progress-bar mode="indeterminate" />
    }
    @if (facade.error(); as error) {
      <p class="error" role="alert" data-testid="list-error">{{ error }}</p>
    }

    <div class="table-card">
      <table mat-table [dataSource]="facade.packs()">
        <ng-container matColumnDef="size">
          <th mat-header-cell *matHeaderCellDef>Pack</th>
          <td mat-cell *matCellDef="let pack">
            <span class="status pack">{{ pack.size }} reservas</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="price">
          <th mat-header-cell *matHeaderCellDef>Precio</th>
          <td mat-cell *matCellDef="let pack" class="money">{{ pack.price | currency: 'EUR' }}</td>
        </ng-container>
        <ng-container matColumnDef="perReservation">
          <th mat-header-cell *matHeaderCellDef>Precio por reserva</th>
          <td mat-cell *matCellDef="let pack" class="money muted">
            {{ pack.pricePerReservation | currency: 'EUR' }}
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>
            <span class="cdk-visually-hidden">Acciones</span>
          </th>
          <td mat-cell *matCellDef="let pack">
            <button
              matIconButton
              (click)="openEdit(pack)"
              data-testid="edit"
              aria-label="Editar precio"
              matTooltip="Editar precio"
            >
              <mat-icon>edit</mat-icon>
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns" data-testid="pack-row"></tr>
        <tr class="mat-mdc-row" *matNoDataRow>
          <td class="mat-mdc-cell empty" [attr.colspan]="columns.length">
            {{ facade.loading() ? 'Cargando packs…' : 'No hay packs de crédito.' }}
          </td>
        </tr>
      </table>
    </div>
  `,
  styles: `
    .intro {
      margin: calc(-1 * var(--app-space-2)) 0 var(--app-space-3);
    }
    .status.pack {
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
    .money {
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class CreditPackListPage {
  protected readonly facade = inject(CreditPackFacade);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly columns = ['size', 'price', 'perReservation', 'actions'];

  constructor() {
    void this.facade.listPacks();
  }

  protected openEdit(pack: CreditPackRow): void {
    this.dialog
      .open<CreditPackFormDialog, CreditPackRow, CreditPack>(CreditPackFormDialog, { data: pack })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.snackBar.open(
            `Precio del pack de ${saved.size} reservas actualizado.`,
            'OK',
            SNACK_DURATION,
          );
          void this.facade.refresh();
        }
      });
  }
}
