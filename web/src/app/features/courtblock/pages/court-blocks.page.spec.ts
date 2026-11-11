import { signal } from '@angular/core';
import { provideSpanishLocale } from '../../../core/locale/spanish-locale';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Court, CourtBlock, CourtType } from '../../../shared/models';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm.dialog';
import { CourtFacade } from '../../court/court.facade';
import { CourtBlockError, CourtBlockFacade } from '../courtblock.facade';
import { BlockFormDialog } from './block-form.dialog';
import { CourtBlocksPage } from './court-blocks.page';

describe('CourtBlocksPage', () => {
  const court: Court = {
    id: 3,
    name: 'Pista 3',
    type: CourtType.GLASS,
    indoor: true,
    active: true,
  };
  const morning: CourtBlock = {
    id: 9,
    courtId: 3,
    date: '2026-06-09',
    start: '07:00',
    end: '09:00',
    reason: 'Mantenimiento',
  };
  const later: CourtBlock = {
    id: 10,
    courtId: 3,
    date: '2026-06-12',
    start: '18:00',
    end: '20:00',
    reason: null,
  };

  let facade: {
    blocks: ReturnType<typeof signal<CourtBlock[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    listBlocks: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
    removeBlock: ReturnType<typeof vi.fn>;
  };
  let courts: {
    selected: ReturnType<typeof signal<Court | null>>;
    getCourt: ReturnType<typeof vi.fn>;
  };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<CourtBlocksPage>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 5, 8, 12, 0));
  });

  afterEach(() => vi.useRealTimers());

  function render(blocks: CourtBlock[] = [morning, later]) {
    facade = {
      blocks: signal(blocks),
      loading: signal(false),
      error: signal<string | null>(null),
      listBlocks: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
      removeBlock: vi.fn().mockResolvedValue(undefined),
    };
    courts = {
      selected: signal<Court | null>(court),
      getCourt: vi.fn().mockResolvedValue(undefined),
    };
    dialog = { open: vi.fn() };
    snackBar = { open: vi.fn() };
    TestBed.configureTestingModule({
      imports: [CourtBlocksPage],
      providers: [
        provideSpanishLocale(),
        provideRouter([]),
        { provide: CourtBlockFacade, useValue: facade },
        { provide: CourtFacade, useValue: courts },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    fixture = TestBed.createComponent(CourtBlocksPage);
    fixture.componentRef.setInput('courtId', '3');
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const rows = (element: HTMLElement) =>
    [...element.querySelectorAll('[data-testid="block-row"]')].map((row) =>
      [...row.querySelectorAll('td')].slice(0, 3).map((cell) => cell.textContent?.trim()),
    );
  const click = (element: Element | null | undefined) => (element as HTMLElement).click();
  const removeButton = (element: HTMLElement, row: number) =>
    element
      .querySelectorAll('[data-testid="block-row"]')
      [row].querySelector('[data-testid="remove"]');
  const dialogClosingWith = (value: unknown) =>
    dialog.open.mockReturnValueOnce({ afterClosed: () => of(value) });
  const flush = () => new Promise((resolve) => setTimeout(resolve));

  it('loads the upcoming blocks of the court and shows its name', () => {
    const element = render();

    expect(facade.listBlocks).toHaveBeenCalledWith(3, { from: '2026-06-08' });
    expect(courts.getCourt).toHaveBeenCalledWith(3);
    expect(element.querySelector('h1')?.textContent).toContain('Bloqueos · Pista 3');
  });

  it('lists date, time range and reason in Spanish', () => {
    const element = render();

    expect(rows(element)).toEqual([
      ['martes, 9 de junio de 2026', '07:00 – 09:00', 'Mantenimiento'],
      ['viernes, 12 de junio de 2026', '18:00 – 20:00', '—'],
    ]);
  });

  it('can include past blocks', () => {
    const element = render();

    click(element.querySelector('[data-testid="show-past"] input'));
    fixture.detectChanges();

    expect(facade.listBlocks).toHaveBeenLastCalledWith(3, {});
  });

  it('shows an empty state and the load error', () => {
    const element = render([]);
    facade.error.set('No se pudieron cargar los bloqueos.');
    fixture.detectChanges();

    expect(element.textContent).toContain('No hay bloqueos próximos.');
    expect(element.querySelector('[data-testid="list-error"]')?.textContent?.trim()).toBe(
      'No se pudieron cargar los bloqueos.',
    );
  });

  it('opens the block modal for the court, then confirms and refreshes', async () => {
    const element = render();
    dialogClosingWith({ ...morning, id: 11 });

    click(element.querySelector('[data-testid="create"]'));
    await flush();

    expect(dialog.open).toHaveBeenCalledWith(
      BlockFormDialog,
      expect.objectContaining({ data: { courtId: 3, courtName: 'Pista 3' } }),
    );
    expect(snackBar.open).toHaveBeenCalledWith('Bloqueo creado.', 'OK', expect.anything());
    expect(facade.refresh).toHaveBeenCalled();
  });

  it('does nothing when the modal is cancelled', async () => {
    const element = render();
    dialogClosingWith(undefined);

    click(element.querySelector('[data-testid="create"]'));
    await flush();

    expect(facade.refresh).not.toHaveBeenCalled();
  });

  describe('remove', () => {
    it('removes a block only after confirming, then refreshes', async () => {
      const element = render();
      dialogClosingWith(true);

      click(removeButton(element, 0));
      await flush();

      expect(dialog.open).toHaveBeenCalledWith(
        ConfirmDialog,
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Quitar bloqueo',
            message: expect.stringContaining('07:00 – 09:00'),
            confirmLabel: 'Quitar',
          }),
        }),
      );
      expect(facade.removeBlock).toHaveBeenCalledWith(9);
      expect(snackBar.open).toHaveBeenCalledWith('Bloqueo quitado.', 'OK', expect.anything());
      expect(facade.refresh).toHaveBeenCalled();
    });

    it('does not remove when the confirmation is cancelled', async () => {
      const element = render();
      dialogClosingWith(false);

      click(removeButton(element, 0));
      await flush();

      expect(facade.removeBlock).not.toHaveBeenCalled();
    });

    it('shows the error and still refreshes', async () => {
      const element = render();
      dialogClosingWith(true);
      facade.removeBlock.mockRejectedValue(new CourtBlockError('El bloqueo ya no existe.'));

      click(removeButton(element, 1));
      await flush();

      expect(snackBar.open).toHaveBeenCalledWith(
        'El bloqueo ya no existe.',
        'OK',
        expect.anything(),
      );
      expect(facade.refresh).toHaveBeenCalled();
    });
  });
});
