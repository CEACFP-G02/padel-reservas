import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { provideSpanishLocale } from '../../../core/locale/spanish-locale';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatListOptionHarness } from '@angular/material/list/testing';

import { Client, Schedule } from '../../../shared/models';
import { bookingFixture } from '../../../testing/fixtures';
import { ScheduleFacade } from '../../schedule/schedule.facade';
import { UserFacade } from '../../user/user.facade';
import { BookingError, BookingFacade } from '../booking.facade';
import { ManualBookingDialog, ManualBookingDialogData } from './manual-booking.dialog';

describe('ManualBookingDialog', () => {
  const slot: ManualBookingDialogData = {
    courtId: 3,
    courtName: 'Pista 3',
    date: '2026-06-08',
    start: '07:00',
    end: '08:00',
  };
  const ana: Client = {
    id: 42,
    name: 'Ana López',
    email: 'ana@padel.test',
    phone: null,
    active: true,
  };
  const bruno: Client = {
    id: 43,
    name: 'Bruno Gil',
    email: 'bruno@padel.test',
    phone: null,
    active: false,
  };
  const carla: Client = {
    id: 44,
    name: 'Carla Ruiz',
    email: 'carla@padel.test',
    phone: null,
    active: true,
  };
  const schedule: Schedule = { slotMinutes: 60, price: 16, weekdays: [] };

  let users: {
    clients: ReturnType<typeof signal<Client[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    listClients: ReturnType<typeof vi.fn>;
  };
  let schedules: {
    schedule: ReturnType<typeof signal<Schedule | null>>;
    getSchedule: ReturnType<typeof vi.fn>;
  };
  let bookings: { createBooking: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<ManualBookingDialog>;
  let loader: HarnessLoader;
  let element: HTMLElement;

  beforeEach(() => {
    users = {
      clients: signal([ana, bruno, carla]),
      loading: signal(false),
      error: signal<string | null>(null),
      listClients: vi.fn().mockResolvedValue(undefined),
    };
    schedules = {
      schedule: signal<Schedule | null>(schedule),
      getSchedule: vi.fn().mockResolvedValue(undefined),
    };
    bookings = { createBooking: vi.fn() };
    dialogRef = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ManualBookingDialog],
      providers: [
        provideSpanishLocale(),
        { provide: UserFacade, useValue: users },
        { provide: ScheduleFacade, useValue: schedules },
        { provide: BookingFacade, useValue: bookings },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: slot },
      ],
    });
    fixture = TestBed.createComponent(ManualBookingDialog);
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
    element = fixture.nativeElement;
  });

  const text = (testId: string) =>
    element.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim();
  const options = () => loader.getAllHarnesses(MatListOptionHarness);
  const optionTexts = async () =>
    Promise.all((await options()).map((option) => option.getFullText()));
  const reserve = () => loader.getHarness(MatButtonHarness.with({ text: 'Reservar' }));
  const select = async (name: string) => {
    for (const option of await options()) {
      if ((await option.getFullText()).includes(name)) {
        await option.select();
      }
    }
  };
  const search = async (value: string) => {
    const input = await loader.getHarness(
      MatInputHarness.with({ selector: '[data-testid="client-search"]' }),
    );
    await input.setValue(value);
    (await input.host()).dispatchEvent('keyup', { key: 'Enter' });
  };

  it('shows the slot to book: court, date, time and the schedule price', () => {
    expect(element.querySelector('h2')?.textContent).toContain('Reserva manual');
    expect(schedules.getSchedule).toHaveBeenCalledWith(3);
    expect(text('slot-court')).toBe('Pista 3');
    expect(text('slot-date')).toBe('lunes, 8 de junio de 2026');
    expect(text('slot-time')).toBe('07:00 – 08:00');
    expect(text('slot-price')).toBe('16,00\u00a0€');
  });

  it('loads the clients and offers only the active ones', async () => {
    expect(users.listClients).toHaveBeenCalledWith({ size: 20 });
    const texts = await optionTexts();

    expect(texts).toHaveLength(2);
    expect(texts[0]).toContain('Ana López');
    expect(texts[0]).toContain('ana@padel.test');
    expect(texts[1]).toContain('Carla Ruiz');
  });

  it('searches clients by name or email', async () => {
    await search('  ana ');

    expect(users.listClients).toHaveBeenLastCalledWith({ search: 'ana', size: 20 });
  });

  it('says when no active client matches', async () => {
    users.clients.set([bruno]);
    fixture.detectChanges();

    expect(await options()).toHaveLength(0);
    expect(element.textContent).toContain('No hay clientes activos que coincidan.');
  });

  it('cannot confirm until a client is picked, then books the slot for that client and closes with it', async () => {
    bookings.createBooking.mockResolvedValue(bookingFixture);
    expect(await (await reserve()).isDisabled()).toBe(true);

    await select('Carla Ruiz');
    expect(text('selected-client')).toContain('Carla Ruiz');
    await (await reserve()).click();

    expect(bookings.createBooking).toHaveBeenCalledWith({
      courtId: 3,
      date: '2026-06-08',
      slots: [{ start: '07:00', end: '08:00' }],
      clientId: 44,
    });
    expect(dialogRef.close).toHaveBeenCalledWith(bookingFixture);
  });

  it('shows a slot taken meanwhile (409) inline, stays open and remembers it for the calendar', async () => {
    expect(fixture.componentInstance.slotTaken()).toBe(false);
    bookings.createBooking.mockRejectedValue(
      new BookingError('Ese turno acaba de ocuparse en esta pista. Elige otro.', true),
    );
    await select('Ana López');
    await (await reserve()).click();

    expect(text('booking-error')).toBe('Ese turno acaba de ocuparse en esta pista. Elige otro.');
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(fixture.componentInstance.slotTaken()).toBe(true);
  });

  it('shows an inactive client (400) inline and stays open', async () => {
    bookings.createBooking.mockRejectedValue(
      new BookingError('El cliente está dado de baja. Reactívalo en Clientes antes de reservar.'),
    );
    await select('Ana López');
    await (await reserve()).click();

    expect(text('booking-error')).toBe(
      'El cliente está dado de baja. Reactívalo en Clientes antes de reservar.',
    );
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(fixture.componentInstance.slotTaken()).toBe(false);
  });

  it('closes empty on Cancelar', async () => {
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Cancelar' }))).click();

    expect(dialogRef.close).toHaveBeenCalledWith();
    expect(bookings.createBooking).not.toHaveBeenCalled();
  });
});
