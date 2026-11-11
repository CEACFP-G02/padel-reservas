import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { Client } from '../../../shared/models';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/ui/confirm-dialog/confirm.dialog';
import { ClientError, UserFacade } from '../user.facade';
import { ClientFormDialog } from './client-form.dialog';

const SNACK_DURATION = { duration: 4000 };

@Component({
  selector: 'app-client-list-page',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatTooltipModule,
    RouterLink,
  ],
  template: `
    <header class="page-header">
      <h1>Clientes</h1>
      <span class="spacer"></span>
      <button matButton (click)="facade.refresh()" data-testid="refresh">
        <mat-icon>refresh</mat-icon> Actualizar
      </button>
      <button matButton="filled" (click)="openCreate()" data-testid="create">
        <mat-icon>person_add</mat-icon> Nuevo cliente
      </button>
    </header>

    <mat-form-field class="search">
      <mat-label>Buscar por nombre, email o teléfono</mat-label>
      <input matInput #query data-testid="search" (keyup.enter)="search(query.value)" />
      <button matIconButton matSuffix (click)="search(query.value)" aria-label="Buscar">
        <mat-icon>search</mat-icon>
      </button>
    </mat-form-field>

    @if (facade.loading()) {
      <mat-progress-bar mode="indeterminate" />
    }
    @if (facade.error(); as error) {
      <p class="error" role="alert" data-testid="list-error">{{ error }}</p>
    }

    <table mat-table [dataSource]="facade.clients()">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Nombre</th>
        <td mat-cell *matCellDef="let c">
          <a [routerLink]="[c.id]">{{ c.name }}</a>
        </td>
      </ng-container>
      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>Email</th>
        <td mat-cell *matCellDef="let c">{{ c.email }}</td>
      </ng-container>
      <ng-container matColumnDef="phone">
        <th mat-header-cell *matHeaderCellDef>Teléfono</th>
        <td mat-cell *matCellDef="let c">{{ c.phone ?? '—' }}</td>
      </ng-container>
      <ng-container matColumnDef="active">
        <th mat-header-cell *matHeaderCellDef>Estado</th>
        <td mat-cell *matCellDef="let c" [class.inactive]="!c.active">
          {{ c.active ? 'Activo' : 'Inactivo' }}
        </td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef><span class="cdk-visually-hidden">Acciones</span></th>
        <td mat-cell *matCellDef="let c">
          <button
            matIconButton
            (click)="openEdit(c)"
            data-testid="edit"
            aria-label="Editar"
            matTooltip="Editar"
          >
            <mat-icon>edit</mat-icon>
          </button>
          <button
            matIconButton
            (click)="deactivate(c)"
            [disabled]="!c.active"
            data-testid="deactivate"
            aria-label="Dar de baja"
            matTooltip="Dar de baja"
          >
            <mat-icon>person_off</mat-icon>
          </button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns" data-testid="client-row"></tr>
      <tr class="mat-mdc-row" *matNoDataRow>
        <td class="mat-mdc-cell empty" [attr.colspan]="columns.length">
          {{ facade.loading() ? 'Cargando clientes…' : 'No hay clientes.' }}
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
    .search {
      width: 100%;
      max-width: 420px;
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
export class ClientListPage {
  protected readonly facade = inject(UserFacade);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly columns = ['name', 'email', 'phone', 'active', 'actions'];

  constructor() {
    void this.facade.listClients({});
  }

  protected search(value: string): void {
    const search = value.trim();
    void this.facade.listClients(search ? { search, page: 0 } : { page: 0 });
  }

  protected changePage(event: PageEvent): void {
    void this.facade.listClients({
      ...this.facade.filters(),
      page: event.pageIndex,
      size: event.pageSize,
    });
  }

  protected openCreate(): void {
    this.openForm(null, (saved) => `Cliente «${saved.name}» creado.`);
  }

  protected openEdit(client: Client): void {
    this.openForm(client, (saved) => `Cliente «${saved.name}» actualizado.`);
  }

  protected deactivate(client: Client): void {
    const data: ConfirmDialogData = {
      title: 'Dar de baja al cliente',
      message: `«${client.name}» no podrá volver a iniciar sesión. Si tiene reservas, la cuenta se desactiva y se conservan; si no tiene ninguna, se elimina.`,
      confirmLabel: 'Dar de baja',
    };
    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data })
      .afterClosed()
      .subscribe(async (confirmed) => {
        if (!confirmed) {
          return;
        }
        try {
          await this.facade.deleteClient(client.id);
          this.notify(`Cliente «${client.name}» dado de baja.`);
        } catch (error) {
          this.notify(
            error instanceof ClientError ? error.message : 'No se pudo dar de baja al cliente.',
          );
        }
        await this.facade.refresh();
      });
  }

  private openForm(client: Client | null, success: (saved: Client) => string): void {
    this.dialog
      .open<ClientFormDialog, Client | null, Client>(ClientFormDialog, { data: client })
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
