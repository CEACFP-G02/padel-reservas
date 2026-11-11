import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerInputHarness } from '@angular/material/datepicker/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';

import { CourtBlock } from '../../../shared/models';
import { CourtBlockError, CourtBlockFacade } from '../courtblock.facade';
import { BlockFormDialog, BlockFormDialogData } from './block-form.dialog';

describe('BlockFormDialog', () => {
  const data: BlockFormDialogData = { courtId: 3, courtName: 'Pista 3' };
  const created: CourtBlock = {
    id: 11,
    courtId: 3,
    date: '2026-06-10',
    start: '10:00',
    end: '12:00',
    reason: 'Torneo',
  };

  let facade: { createBlock: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let loader: HarnessLoader;
  let element: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 5, 8, 12, 0));
    facade = { createBlock: vi.fn() };
    dialogRef = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [BlockFormDialog],
      providers: [
        provideNativeDateAdapter(),
        { provide: CourtBlockFacade, useValue: facade },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });
    const fixture = TestBed.createComponent(BlockFormDialog);
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
    element = fixture.nativeElement;
  });

  afterEach(() => vi.useRealTimers());

  const date = () => loader.getHarness(MatDatepickerInputHarness);
  const input = (name: string) =>
    loader.getHarness(MatInputHarness.with({ selector: `[formControlName="${name}"]` }));
  const fill = async (name: string, value: string) => (await input(name)).setValue(value);
  const save = async () =>
    (await loader.getHarness(MatButtonHarness.with({ text: 'Bloquear' }))).click();
  const errorOf = async (label: string) =>
    (
      await loader.getHarness(MatFormFieldHarness.with({ floatingLabelText: label }))
    ).getTextErrors();
  const formError = () => element.querySelector('[data-testid="form-error"]')?.textContent?.trim();

  async function fillValid(day = '6/10/2026', start = '10:00', end = '12:00') {
    await (await date()).setValue(day);
    await fill('start', start);
    await fill('end', end);
    await fill('reason', '  Torneo ');
  }

  it('is titled for the court and does not offer past days', async () => {
    expect(element.querySelector('h2')?.textContent).toContain('Nuevo bloqueo · Pista 3');
    expect(await (await date()).getMin()).toBe('2026-06-08');
  });

  it('requires date, start and end', async () => {
    await save();

    expect(await errorOf('Fecha')).toEqual(['Indica la fecha.']);
    expect(await errorOf('Desde')).toEqual(['Indica la hora de inicio.']);
    expect(await errorOf('Hasta')).toEqual(['Indica la hora de fin.']);
    expect(facade.createBlock).not.toHaveBeenCalled();
  });

  it('requires the end after the start', async () => {
    await fillValid('6/10/2026', '12:00', '10:00');
    await save();

    expect(await errorOf('Hasta')).toEqual(['La hora de fin debe ser posterior a la de inicio.']);
    expect(facade.createBlock).not.toHaveBeenCalled();
  });

  it('rejects a block that has already ended today', async () => {
    await fillValid('6/8/2026', '09:00', '11:00');
    await save();

    expect(formError()).toBe('Ese bloqueo ya ha terminado. Elige una fecha y hora futuras.');
    expect(facade.createBlock).not.toHaveBeenCalled();
  });

  it('creates the block with the trimmed reason and closes with it', async () => {
    facade.createBlock.mockResolvedValue(created);
    await fillValid();
    await save();

    expect(facade.createBlock).toHaveBeenCalledWith(3, {
      date: '2026-06-10',
      start: '10:00',
      end: '12:00',
      reason: 'Torneo',
    });
    expect(dialogRef.close).toHaveBeenCalledWith(created);
  });

  it('omits an empty reason', async () => {
    facade.createBlock.mockResolvedValue(created);
    await fillValid();
    await fill('reason', '   ');
    await save();

    expect(facade.createBlock).toHaveBeenCalledWith(3, {
      date: '2026-06-10',
      start: '10:00',
      end: '12:00',
    });
  });

  it('shows an overlapping booking (409) inline and stays open', async () => {
    facade.createBlock.mockRejectedValue(
      new CourtBlockError(
        'Coincide con la reserva 5001 (11:00–12:00). Cancélala o cámbiala de hora antes de bloquear.',
      ),
    );
    await fillValid();
    await save();

    expect(formError()).toBe(
      'Coincide con la reserva 5001 (11:00–12:00). Cancélala o cámbiala de hora antes de bloquear.',
    );
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('shows 400 field errors from the API on their fields', async () => {
    facade.createBlock.mockRejectedValue(
      new CourtBlockError('Revisa los datos del bloqueo.', {
        end: 'La hora de fin debe ser posterior a la de inicio.',
      }),
    );
    await fillValid();
    await save();

    expect(await errorOf('Hasta')).toEqual(['La hora de fin debe ser posterior a la de inicio.']);
    expect(formError()).toBeUndefined();
  });

  it('closes empty on Cancelar', async () => {
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Cancelar' }))).click();

    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
