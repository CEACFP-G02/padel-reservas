import { Component, effect, inject, input, numberAttribute } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

import { CourtBlock } from '../../../shared/models';
import { CourtBlockFacade } from '../courtblock.facade';

@Component({
  selector: 'app-court-blocks-page',
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h1>Bloqueos de la pista {{ courtId() }}</h1>

    <form class="block-form" [formGroup]="form" (ngSubmit)="create()">
      <mat-form-field>
        <mat-label>Fecha</mat-label>
        <input matInput [matDatepicker]="picker" formControlName="date" />
        <mat-datepicker-toggle matIconSuffix [for]="picker" />
        <mat-datepicker #picker />
      </mat-form-field>
      <mat-form-field>
        <mat-label>Desde</mat-label>
        <input matInput type="time" formControlName="startTime" />
      </mat-form-field>
      <mat-form-field>
        <mat-label>Hasta</mat-label>
        <input matInput type="time" formControlName="endTime" />
      </mat-form-field>
      <mat-form-field>
        <mat-label>Motivo</mat-label>
        <input matInput formControlName="reason" />
      </mat-form-field>
      <button matButton="filled" type="submit" [disabled]="form.invalid">Bloquear</button>
    </form>

    <table mat-table [dataSource]="facade.blocks()">
      <ng-container matColumnDef="date">
        <th mat-header-cell *matHeaderCellDef>Fecha</th>
        <td mat-cell *matCellDef="let block">{{ block.date }}</td>
      </ng-container>
      <ng-container matColumnDef="range">
        <th mat-header-cell *matHeaderCellDef>Horario</th>
        <td mat-cell *matCellDef="let block">{{ block.startTime }} – {{ block.endTime }}</td>
      </ng-container>
      <ng-container matColumnDef="reason">
        <th mat-header-cell *matHeaderCellDef>Motivo</th>
        <td mat-cell *matCellDef="let block">{{ block.reason }}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let block">
          <button matIconButton (click)="remove(block)" aria-label="Quitar bloqueo"><mat-icon>delete</mat-icon></button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>
  `,
  styles: `.block-form { display: flex; flex-wrap: wrap; gap: 12px; align-items: baseline; }`,
})
export class CourtBlocksPage {
  protected readonly facade = inject(CourtBlockFacade);
  readonly courtId = input.required({ transform: numberAttribute });
  protected readonly columns = ['date', 'range', 'reason', 'actions'];

  protected readonly form = inject(FormBuilder).group({
    date: [null as Date | null, Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    reason: [''],
  });

  constructor() {
    effect(() => void this.facade.listBlocks(this.courtId()));
  }

  protected create(): void {
    // TODO: map form (toIsoDate, HH:mm -> HH:mm:00) -> facade.createBlock(courtId, request)
    //  — see docs/api.md#post-apiv1courtscourtidblocks
  }

  protected remove(block: CourtBlock): void {
    void this.facade.removeBlock(this.courtId(), block.id);
  }
}
