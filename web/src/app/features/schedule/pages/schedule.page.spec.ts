import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Court, CourtType, Schedule } from '../../../shared/models';
import { CourtFacade } from '../../court/court.facade';
import { ScheduleFacade } from '../schedule.facade';
import { ScheduleFormDialog } from './schedule-form.dialog';
import { SchedulePage } from './schedule.page';

describe('SchedulePage', () => {
  const court: Court = {
    id: 3,
    name: 'Pista 3',
    type: CourtType.GLASS,
    indoor: true,
    active: true,
  };
  const schedule: Schedule = {
    slotMinutes: 90,
    price: 16,
    weekdays: [
      { day: 'MONDAY', open: '17:00', close: '22:00' },
      { day: 'MONDAY', open: '08:00', close: '14:00' },
      { day: 'SUNDAY', open: '09:00', close: '14:00' },
    ],
  };

  let scheduleFacade: {
    schedule: ReturnType<typeof signal<Schedule | null>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    getSchedule: ReturnType<typeof vi.fn>;
  };
  let courtFacade: {
    selected: ReturnType<typeof signal<Court | null>>;
    getCourt: ReturnType<typeof vi.fn>;
  };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<SchedulePage>;

  function render(current: Schedule | null = schedule) {
    scheduleFacade = {
      schedule: signal(current),
      loading: signal(false),
      error: signal<string | null>(null),
      getSchedule: vi.fn().mockResolvedValue(undefined),
    };
    courtFacade = {
      selected: signal<Court | null>(court),
      getCourt: vi.fn().mockResolvedValue(undefined),
    };
    dialog = { open: vi.fn() };
    snackBar = { open: vi.fn() };
    TestBed.configureTestingModule({
      imports: [SchedulePage],
      providers: [
        provideRouter([]),
        { provide: ScheduleFacade, useValue: scheduleFacade },
        { provide: CourtFacade, useValue: courtFacade },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    fixture = TestBed.createComponent(SchedulePage);
    fixture.componentRef.setInput('courtId', 3);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const rows = (element: HTMLElement) =>
    [...element.querySelectorAll('[data-testid="day-row"]')].map((row) =>
      [...row.querySelectorAll('td')].map((cell) => cell.textContent?.trim()),
    );
  const editButton = (element: HTMLElement) =>
    element.querySelector('[data-testid="edit"]') as HTMLButtonElement;

  it('loads the schedule and the court for the route court id', () => {
    const element = render();

    expect(scheduleFacade.getSchedule).toHaveBeenCalledWith(3);
    expect(courtFacade.getCourt).toHaveBeenCalledWith(3);
    expect(element.querySelector('h1')?.textContent).toContain('Horario de «Pista 3»');
  });

  it('shows slot length, price and every weekday in Spanish, with sorted ranges or Cerrado', () => {
    const element = render();

    expect(element.querySelector('[data-testid="summary"]')?.textContent).toContain(
      'Turnos de 90 min · €16.00 por turno',
    );
    expect(rows(element)).toEqual([
      ['Lunes', '08:00–14:00, 17:00–22:00'],
      ['Martes', 'Cerrado'],
      ['Miércoles', 'Cerrado'],
      ['Jueves', 'Cerrado'],
      ['Viernes', 'Cerrado'],
      ['Sábado', 'Cerrado'],
      ['Domingo', '09:00–14:00'],
    ]);
    expect(editButton(element).textContent).toContain('Editar horario');
  });

  it('tells the owner when the court has no schedule yet and offers to create one', () => {
    const element = render(null);

    expect(element.textContent).toContain('Esta pista todavía no tiene horario.');
    expect(rows(element)).toEqual([]);
    expect(editButton(element).textContent).toContain('Crear horario');
  });

  it('shows the load error', () => {
    const element = render(null);
    scheduleFacade.error.set('No se pudo cargar el horario.');
    fixture.detectChanges();

    expect(element.querySelector('[data-testid="load-error"]')?.textContent?.trim()).toBe(
      'No se pudo cargar el horario.',
    );
    expect(element.textContent).not.toContain('Esta pista todavía no tiene horario.');
  });

  it('opens the edit modal with the court and current schedule, then confirms and refreshes', () => {
    const element = render();
    dialog.open.mockReturnValueOnce({ afterClosed: () => of(schedule) });

    editButton(element).click();

    expect(dialog.open).toHaveBeenCalledWith(
      ScheduleFormDialog,
      expect.objectContaining({ data: { courtId: 3, schedule } }),
    );
    expect(snackBar.open).toHaveBeenCalledWith('Horario guardado.', 'OK', expect.anything());
    expect(scheduleFacade.getSchedule).toHaveBeenCalledTimes(2);
  });

  it('does nothing when the modal is cancelled', () => {
    const element = render();
    dialog.open.mockReturnValueOnce({ afterClosed: () => of(undefined) });

    editButton(element).click();

    expect(snackBar.open).not.toHaveBeenCalled();
    expect(scheduleFacade.getSchedule).toHaveBeenCalledTimes(1);
  });

  it('links back to the courts list', () => {
    const element = render();

    expect(element.querySelector('[data-testid="back"]')?.getAttribute('href')).toBe('/courts');
  });
});
