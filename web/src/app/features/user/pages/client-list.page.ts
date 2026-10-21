import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';

import { User } from '../../../shared/models';
import { UserFacade } from '../user.facade';
import { ClientFormDialog } from './client-form.dialog';

@Component({
  selector: 'app-client-list-page',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatPaginatorModule, RouterLink],
  template: `
    <header class="page-header">
      <h1>Clientes</h1>
      <button matButton="filled" (click)="openCreate()"><mat-icon>person_add</mat-icon> Nuevo cliente</button>
    </header>

    @if (facade.loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <table mat-table [dataSource]="facade.clients()">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Nombre</th>
        <td mat-cell *matCellDef="let c"><a [routerLink]="[c.id]">{{ c.name }}</a></td>
      </ng-container>
      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>Email</th>
        <td mat-cell *matCellDef="let c">{{ c.email }}</td>
      </ng-container>
      <ng-container matColumnDef="phone">
        <th mat-header-cell *matHeaderCellDef>Teléfono</th>
        <td mat-cell *matCellDef="let c">{{ c.phone }}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let c">
          <button matIconButton (click)="openEdit(c)" aria-label="Editar"><mat-icon>edit</mat-icon></button>
          <button matIconButton (click)="delete(c)" aria-label="Eliminar"><mat-icon>delete</mat-icon></button>
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
export class ClientListPage {
  protected readonly facade = inject(UserFacade);
  private readonly dialog = inject(MatDialog);
  protected readonly columns = ['name', 'email', 'phone', 'actions'];

  constructor() {
    void this.facade.listClients();
  }

  protected changePage(event: PageEvent): void {
    void this.facade.listClients({ page: event.pageIndex, size: event.pageSize });
  }

  protected openCreate(): void {
    // TODO: on close with a request -> facade.createClient(request) — see docs/api.md#users--clients--apiv1users
    this.dialog.open(ClientFormDialog);
  }

  protected openEdit(client: User): void {
    // TODO: on close with a request -> facade.updateClient(client.id, request) — see docs/api.md#users--clients--apiv1users
    this.dialog.open(ClientFormDialog, { data: client });
  }

  protected delete(client: User): void {
    // TODO: confirm dialog + snackbar — see docs/api.md#users--clients--apiv1users
    void this.facade.deleteClient(client.id);
  }
}
