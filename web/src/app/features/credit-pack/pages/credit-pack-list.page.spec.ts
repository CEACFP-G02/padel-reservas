import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { provideSpanishLocale } from '../../../core/locale/spanish-locale';
import { CreditPackFacade, CreditPackRow } from '../credit-pack.facade';
import { CreditPackFormDialog } from './credit-pack-form.dialog';
import { CreditPackListPage } from './credit-pack-list.page';

describe('CreditPackListPage', () => {
  const packs: CreditPackRow[] = [
    { id: 1, size: 5, price: 75, pricePerReservation: 15 },
    { id: 2, size: 10, price: 140, pricePerReservation: 14 },
    { id: 3, size: 15, price: 195, pricePerReservation: 13 },
    { id: 4, size: 20, price: 240, pricePerReservation: 12 },
  ];

  let facade: {
    packs: ReturnType<typeof signal<CreditPackRow[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    listPacks: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
  };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<CreditPackListPage>;

  function render(list: CreditPackRow[] = packs) {
    facade = {
      packs: signal(list),
      loading: signal(false),
      error: signal<string | null>(null),
      listPacks: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    };
    dialog = { open: vi.fn() };
    snackBar = { open: vi.fn() };
    TestBed.configureTestingModule({
      imports: [CreditPackListPage],
      providers: [
        provideSpanishLocale(),
        { provide: CreditPackFacade, useValue: facade },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    fixture = TestBed.createComponent(CreditPackListPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const rows = (element: HTMLElement) =>
    [...element.querySelectorAll('[data-testid="pack-row"]')].map((row) =>
      [...row.querySelectorAll('td')].slice(0, 3).map((cell) => cell.textContent?.trim()),
    );
  const editButton = (element: HTMLElement, row: number) =>
    element
      .querySelectorAll('[data-testid="pack-row"]')
      [row].querySelector('[data-testid="edit"]') as HTMLButtonElement;

  it('loads the packs on start and lists size, price and price per reservation in Spanish', () => {
    const element = render();

    expect(element.querySelector('h1')?.textContent).toContain('Packs de crédito');
    expect(facade.listPacks).toHaveBeenCalledTimes(1);
    expect(rows(element)).toEqual([
      ['5 reservas', '75,00 €', '15,00 €'],
      ['10 reservas', '140,00 €', '14,00 €'],
      ['15 reservas', '195,00 €', '13,00 €'],
      ['20 reservas', '240,00 €', '12,00 €'],
    ]);
  });

  it('shows the loading state and the load error', () => {
    const element = render([]);
    facade.loading.set(true);
    fixture.detectChanges();
    expect(element.textContent).toContain('Cargando packs…');

    facade.loading.set(false);
    facade.error.set('No se pudieron cargar los packs de crédito.');
    fixture.detectChanges();
    expect(element.querySelector('[data-testid="list-error"]')?.textContent?.trim()).toBe(
      'No se pudieron cargar los packs de crédito.',
    );
  });

  it('refreshes the list on Actualizar', () => {
    const element = render();

    (element.querySelector('[data-testid="refresh"]') as HTMLButtonElement).click();

    expect(facade.refresh).toHaveBeenCalled();
  });

  it('edits a pack price in the modal, then confirms and refreshes', () => {
    const element = render();
    dialog.open.mockReturnValueOnce({ afterClosed: () => of({ id: 2, size: 10, price: 130 }) });

    editButton(element, 1).click();

    expect(dialog.open).toHaveBeenCalledWith(
      CreditPackFormDialog,
      expect.objectContaining({ data: packs[1] }),
    );
    expect(snackBar.open).toHaveBeenCalledWith(
      'Precio del pack de 10 reservas actualizado.',
      'OK',
      expect.anything(),
    );
    expect(facade.refresh).toHaveBeenCalled();
  });

  it('does nothing when the modal is cancelled', () => {
    const element = render();
    dialog.open.mockReturnValueOnce({ afterClosed: () => of(undefined) });

    editButton(element, 0).click();

    expect(snackBar.open).not.toHaveBeenCalled();
    expect(facade.refresh).not.toHaveBeenCalled();
  });
});
