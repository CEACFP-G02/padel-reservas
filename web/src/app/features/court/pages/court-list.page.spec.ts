import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Court, CourtType, PageMeta } from '../../../shared/models';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm.dialog';
import { CourtError, CourtFacade } from '../court.facade';
import { CourtFormDialog } from './court-form.dialog';
import { CourtListPage } from './court-list.page';

describe('CourtListPage', () => {
  const glass: Court = {
    id: 1,
    name: 'Pista 1',
    type: CourtType.GLASS,
    indoor: true,
    active: true,
  };
  const wall: Court = {
    id: 2,
    name: 'Pista 2',
    type: CourtType.WALL,
    indoor: false,
    active: false,
  };

  let facade: {
    courts: ReturnType<typeof signal<Court[]>>;
    page: ReturnType<typeof signal<PageMeta | null>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    listCourts: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
    deactivateCourt: ReturnType<typeof vi.fn>;
  };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<CourtListPage>;

  function render(courts: Court[] = [glass, wall]) {
    facade = {
      courts: signal(courts),
      page: signal<PageMeta | null>({
        page: 0,
        size: 20,
        totalElements: courts.length,
        totalPages: 1,
      }),
      loading: signal(false),
      error: signal<string | null>(null),
      listCourts: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
      deactivateCourt: vi.fn().mockResolvedValue(undefined),
    };
    dialog = { open: vi.fn() };
    snackBar = { open: vi.fn() };
    TestBed.configureTestingModule({
      imports: [CourtListPage],
      providers: [
        provideRouter([]),
        { provide: CourtFacade, useValue: facade },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    fixture = TestBed.createComponent(CourtListPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const dialogClosingWith = (value: unknown) =>
    dialog.open.mockReturnValueOnce({ afterClosed: () => of(value) });
  const rows = (element: HTMLElement) =>
    [...element.querySelectorAll('[data-testid="court-row"]')].map((row) =>
      [...row.querySelectorAll('td')].slice(0, 4).map((cell) => cell.textContent?.trim()),
    );
  const click = (element: Element | null) => (element as HTMLButtonElement).click();
  const rowButton = (element: HTMLElement, row: number, testId: string) =>
    element
      .querySelectorAll('[data-testid="court-row"]')
      [row].querySelector(`[data-testid="${testId}"]`);

  it('loads the courts on start and lists active and inactive ones in Spanish', () => {
    const element = render();

    expect(facade.listCourts).toHaveBeenCalledTimes(1);
    expect(rows(element)).toEqual([
      ['Pista 1', 'Cristal', 'Cubierta', 'Activa'],
      ['Pista 2', 'Muro', 'Exterior', 'Inactiva'],
    ]);
    expect(element.querySelector('[data-testid="court-row"] a')?.getAttribute('href')).toBe('/1');
  });

  it('shows an empty state when there are no courts', () => {
    const element = render([]);

    expect(element.textContent).toContain('Todavía no hay pistas.');
  });

  it('shows the load error', () => {
    const element = render();
    facade.error.set('No se pudieron cargar las pistas.');
    fixture.detectChanges();

    expect(element.querySelector('[data-testid="list-error"]')?.textContent?.trim()).toBe(
      'No se pudieron cargar las pistas.',
    );
  });

  it('refreshes the list on Actualizar', () => {
    const element = render();

    click(element.querySelector('[data-testid="refresh"]'));

    expect(facade.refresh).toHaveBeenCalled();
  });

  it('opens the court modal empty to create, then confirms and refreshes', async () => {
    const element = render();
    dialogClosingWith({ ...glass, id: 3, name: 'Pista 3' });

    click(element.querySelector('[data-testid="create"]'));

    expect(dialog.open).toHaveBeenCalledWith(
      CourtFormDialog,
      expect.objectContaining({ data: null }),
    );
    expect(snackBar.open).toHaveBeenCalledWith('Pista «Pista 3» creada.', 'OK', expect.anything());
    expect(facade.refresh).toHaveBeenCalled();
  });

  it('opens the same modal with the court to edit, then confirms and refreshes', () => {
    const element = render();
    dialogClosingWith({ ...wall, name: 'Central' });

    click(rowButton(element, 1, 'edit'));

    expect(dialog.open).toHaveBeenCalledWith(
      CourtFormDialog,
      expect.objectContaining({ data: wall }),
    );
    expect(snackBar.open).toHaveBeenCalledWith(
      'Pista «Central» actualizada.',
      'OK',
      expect.anything(),
    );
    expect(facade.refresh).toHaveBeenCalled();
  });

  it('does nothing when the court modal is cancelled', () => {
    const element = render();
    dialogClosingWith(undefined);

    click(element.querySelector('[data-testid="create"]'));

    expect(snackBar.open).not.toHaveBeenCalled();
    expect(facade.refresh).not.toHaveBeenCalled();
  });

  it('deactivates a court only after confirming, then refreshes', async () => {
    const element = render();
    dialogClosingWith(true);

    click(rowButton(element, 0, 'deactivate'));

    expect(dialog.open).toHaveBeenCalledWith(
      ConfirmDialog,
      expect.objectContaining({
        data: expect.objectContaining({ title: 'Desactivar pista', confirmLabel: 'Desactivar' }),
      }),
    );
    expect(facade.deactivateCourt).toHaveBeenCalledWith(1);
    await vi.waitFor(() => expect(facade.refresh).toHaveBeenCalled());
    expect(snackBar.open).toHaveBeenCalledWith(
      'Pista «Pista 1» desactivada.',
      'OK',
      expect.anything(),
    );
  });

  it('does not deactivate when the confirmation is cancelled', () => {
    const element = render();
    dialogClosingWith(false);

    click(rowButton(element, 0, 'deactivate'));

    expect(facade.deactivateCourt).not.toHaveBeenCalled();
    expect(facade.refresh).not.toHaveBeenCalled();
  });

  it('shows a failed deactivation and refreshes the list', async () => {
    const element = render();
    facade.deactivateCourt.mockRejectedValue(new CourtError('La pista ya no existe.'));
    dialogClosingWith(true);

    click(rowButton(element, 0, 'deactivate'));

    await vi.waitFor(() =>
      expect(snackBar.open).toHaveBeenCalledWith('La pista ya no existe.', 'OK', expect.anything()),
    );
    expect(facade.refresh).toHaveBeenCalled();
  });

  it('cannot deactivate a court that is already inactive', () => {
    const element = render();

    expect((rowButton(element, 1, 'deactivate') as HTMLButtonElement).disabled).toBe(true);
    expect((rowButton(element, 0, 'deactivate') as HTMLButtonElement).disabled).toBe(false);
  });

  it('links each court to its schedule screen', () => {
    const element = render();

    expect(rowButton(element, 0, 'schedule')?.getAttribute('href')).toBe('/courts/1/schedule');
    expect(rowButton(element, 1, 'schedule')?.getAttribute('href')).toBe('/courts/2/schedule');
  });

  it('loads another page from the paginator', () => {
    render();

    fixture.componentInstance['changePage']({ pageIndex: 1, pageSize: 10, length: 12 });

    expect(facade.listCourts).toHaveBeenLastCalledWith({ page: 1, size: 10 });
  });
});
