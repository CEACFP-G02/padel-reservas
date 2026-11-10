import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';

import { Schedule } from '../../../shared/models';
import { ScheduleError, ScheduleFacade } from '../schedule.facade';
import { ScheduleFormDialog, ScheduleFormDialogData } from './schedule-form.dialog';

describe('ScheduleFormDialog', () => {
  const schedule: Schedule = {
    slotMinutes: 60,
    price: 16,
    weekdays: [
      { day: 'MONDAY', open: '08:00', close: '14:00' },
      { day: 'SUNDAY', open: '09:00', close: '14:00' },
    ],
  };

  let facade: { updateSchedule: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let loader: HarnessLoader;
  let element: HTMLElement;

  function open(current: Schedule | null) {
    facade = { updateSchedule: vi.fn() };
    dialogRef = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ScheduleFormDialog],
      providers: [
        { provide: ScheduleFacade, useValue: facade },
        { provide: MatDialogRef, useValue: dialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { courtId: 3, schedule: current } satisfies ScheduleFormDialogData,
        },
      ],
    });
    const fixture = TestBed.createComponent(ScheduleFormDialog);
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
    element = fixture.nativeElement;
  }

  const input = (name: string) =>
    loader.getHarness(MatInputHarness.with({ selector: `[formControlName="${name}"]` }));
  const rangeInputs = (name: 'open' | 'close') =>
    loader.getAllHarnesses(MatInputHarness.with({ selector: `[formControlName="${name}"]` }));
  const daySelects = () => loader.getAllHarnesses(MatSelectHarness);
  const button = async (text: string | RegExp) =>
    (await loader.getHarness(MatButtonHarness.with({ text }))).click();
  const save = () => button('Guardar');
  const fieldErrors = async (label: string) =>
    (
      await loader.getHarness(MatFormFieldHarness.with({ floatingLabelText: label }))
    ).getTextErrors();
  const rangeErrorTexts = () =>
    [...element.querySelectorAll('[data-testid="range-error"]')].map((e) => e.textContent?.trim());
  const formError = () => element.querySelector('[data-testid="form-error"]')?.textContent?.trim();

  async function addRange(day: string, openAt: string, closeAt: string) {
    await button(/Añadir tramo$/);
    const index = (await daySelects()).length - 1;
    await (await daySelects())[index].clickOptions({ text: day });
    await (await rangeInputs('open'))[index].setValue(openAt);
    await (await rangeInputs('close'))[index].setValue(closeAt);
  }

  describe('with an existing schedule', () => {
    beforeEach(() => open(schedule));

    it('is prefilled with slot length, price and one row per opening range', async () => {
      expect(await (await input('slotMinutes')).getValue()).toBe('60');
      expect(await (await input('price')).getValue()).toBe('16');
      const days = await Promise.all((await daySelects()).map((s) => s.getValueText()));
      expect(days).toEqual(['Lunes', 'Domingo']);
      const opens = await Promise.all((await rangeInputs('open')).map((i) => i.getValue()));
      const closes = await Promise.all((await rangeInputs('close')).map((i) => i.getValue()));
      expect(opens).toEqual(['08:00', '09:00']);
      expect(closes).toEqual(['14:00', '14:00']);
    });

    it('saves the whole schedule (ranges sorted by day and time) and closes with it', async () => {
      const saved: Schedule = { ...schedule, price: 18.5 };
      facade.updateSchedule.mockResolvedValue(saved);
      await (await input('price')).setValue('18.5');
      await addRange('Lunes', '17:00', '22:00');
      await addRange('Martes', '09:00', '13:00');

      await save();

      expect(facade.updateSchedule).toHaveBeenCalledWith(3, {
        slotMinutes: 60,
        price: 18.5,
        weekdays: [
          { day: 'MONDAY', open: '08:00', close: '14:00' },
          { day: 'MONDAY', open: '17:00', close: '22:00' },
          { day: 'TUESDAY', open: '09:00', close: '13:00' },
          { day: 'SUNDAY', open: '09:00', close: '14:00' },
        ],
      });
      expect(dialogRef.close).toHaveBeenCalledWith(saved);
    });

    it('allows a range that starts exactly when another one of the same day ends', async () => {
      facade.updateSchedule.mockResolvedValue(schedule);
      await addRange('Lunes', '14:00', '20:00');

      await save();

      expect(facade.updateSchedule).toHaveBeenCalled();
    });

    it('rejects overlapping ranges of the same day without calling the API', async () => {
      await addRange('Lunes', '13:00', '15:00');

      await save();

      expect(facade.updateSchedule).not.toHaveBeenCalled();
      expect(rangeErrorTexts()).toEqual(['Se solapa con el tramo 08:00–14:00 del mismo día.']);
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('rejects a range that closes before it opens or is shorter than one slot', async () => {
      await addRange('Martes', '12:00', '10:00');
      await addRange('Miércoles', '10:00', '10:30');

      await save();

      expect(facade.updateSchedule).not.toHaveBeenCalled();
      expect(rangeErrorTexts()).toEqual([
        'El cierre debe ser posterior a la apertura.',
        'El tramo debe durar al menos un turno (60 min).',
      ]);
    });

    it('removes a range', async () => {
      facade.updateSchedule.mockResolvedValue(schedule);
      const removeButtons = await loader.getAllHarnesses(
        MatButtonHarness.with({ selector: '[aria-label="Quitar tramo"]' }),
      );
      await removeButtons[0].click();

      await save();

      expect(facade.updateSchedule).toHaveBeenCalledWith(3, {
        slotMinutes: 60,
        price: 16,
        weekdays: [{ day: 'SUNDAY', open: '09:00', close: '14:00' }],
      });
    });

    it.each([
      ['-1', 'El precio debe ser mayor o igual que 0, con 2 decimales como máximo.'],
      ['16.555', 'El precio debe ser mayor o igual que 0, con 2 decimales como máximo.'],
      ['', 'El precio es obligatorio.'],
    ])('rejects the price %j', async (price, message) => {
      await (await input('price')).setValue(price);

      await save();

      expect(facade.updateSchedule).not.toHaveBeenCalled();
      expect(await fieldErrors('Precio por turno (€)')).toEqual([message]);
    });

    it.each(['20', '241', '45.5', ''])('rejects the slot length %j', async (minutes) => {
      await (await input('slotMinutes')).setValue(minutes);

      await save();

      expect(facade.updateSchedule).not.toHaveBeenCalled();
      expect(await fieldErrors('Duración del turno (min)')).toEqual([
        'La duración del turno debe estar entre 30 y 240 minutos.',
      ]);
    });

    it('re-checks every range against a new slot length', async () => {
      await addRange('Martes', '10:00', '12:00');
      await (await input('slotMinutes')).setValue('180');

      await save();

      expect(facade.updateSchedule).not.toHaveBeenCalled();
      expect(rangeErrorTexts()).toEqual(['El tramo debe durar al menos un turno (180 min).']);
    });

    it('shows an API rule violation (400) inline and stays open', async () => {
      facade.updateSchedule.mockRejectedValue(
        new ScheduleError(
          'El servidor rechazó el horario: MONDAY 08:00-14:00: shorter than one slot',
        ),
      );

      await save();

      expect(formError()).toBe(
        'El servidor rechazó el horario: MONDAY 08:00-14:00: shorter than one slot',
      );
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('shows API field errors (400) on their fields', async () => {
      facade.updateSchedule.mockRejectedValue(
        new ScheduleError('Revisa los datos del horario.', {
          price: 'El precio debe ser mayor o igual que 0, con 2 decimales como máximo.',
        }),
      );

      await save();

      expect(await fieldErrors('Precio por turno (€)')).toEqual([
        'El precio debe ser mayor o igual que 0, con 2 decimales como máximo.',
      ]);
      expect(formError()).toBe('Revisa los datos del horario.');
    });

    it('closes without saving on Cancelar', async () => {
      await button('Cancelar');

      expect(dialogRef.close).toHaveBeenCalledWith();
      expect(facade.updateSchedule).not.toHaveBeenCalled();
    });
  });

  describe('for a court without a schedule', () => {
    beforeEach(() => open(null));

    it('starts with 60-minute slots, no price and no ranges', async () => {
      expect(await (await input('slotMinutes')).getValue()).toBe('60');
      expect(await (await input('price')).getValue()).toBe('');
      expect(await daySelects()).toHaveLength(0);
      expect(element.textContent).toContain('Sin tramos: la pista estará cerrada toda la semana.');
    });

    it('can save a schedule closed all week', async () => {
      facade.updateSchedule.mockResolvedValue({ slotMinutes: 60, price: 0, weekdays: [] });
      await (await input('price')).setValue('0');

      await save();

      expect(facade.updateSchedule).toHaveBeenCalledWith(3, {
        slotMinutes: 60,
        price: 0,
        weekdays: [],
      });
    });
  });
});
