import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Client, ClientQuery, PageMeta } from '../../../shared/models';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm.dialog';
import { ClientError, UserFacade } from '../user.facade';
import { ClientFormDialog } from './client-form.dialog';
import { ClientListPage } from './client-list.page';

describe('ClientListPage', () => {
  const ana: Client = {
    id: 42,
    name: 'Ana López',
    email: 'ana@padel.test',
    phone: '600000000',
    active: true,
  };
  const bruno: Client = {
    id: 43,
    name: 'Bruno Gil',
    email: 'bruno@padel.test',
    phone: null,
    active: false,
  };

  let facade: {
    clients: ReturnType<typeof signal<Client[]>>;
    page: ReturnType<typeof signal<PageMeta | null>>;
    filters: ReturnType<typeof signal<ClientQuery>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    listClients: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
    deleteClient: ReturnType<typeof vi.fn>;
  };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<ClientListPage>;

  function render(clients: Client[] = [ana, bruno]) {
    facade = {
      clients: signal(clients),
      page: signal<PageMeta | null>({
        page: 0,
        size: 20,
        totalElements: clients.length,
        totalPages: 1,
      }),
      filters: signal<ClientQuery>({}),
      loading: signal(false),
      error: signal<string | null>(null),
      listClients: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
      deleteClient: vi.fn().mockResolvedValue(undefined),
    };
    dialog = { open: vi.fn() };
    snackBar = { open: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ClientListPage],
      providers: [
        provideRouter([]),
        { provide: UserFacade, useValue: facade },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    fixture = TestBed.createComponent(ClientListPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const dialogClosingWith = (value: unknown) =>
    dialog.open.mockReturnValueOnce({ afterClosed: () => of(value) });
  const rows = (element: HTMLElement) =>
    [...element.querySelectorAll('[data-testid="client-row"]')].map((row) =>
      [...row.querySelectorAll('td')].slice(0, 4).map((cell) => cell.textContent?.trim()),
    );
  const click = (element: Element | null) => (element as HTMLElement).click();
  const rowButton = (element: HTMLElement, row: number, testId: string) =>
    element
      .querySelectorAll('[data-testid="client-row"]')
      [row].querySelector(`[data-testid="${testId}"]`);
  const flush = () => new Promise((resolve) => setTimeout(resolve));

  it('loads the clients and lists name, email, phone and status in Spanish', () => {
    const element = render();

    expect(facade.listClients).toHaveBeenCalledWith({});
    expect(rows(element)).toEqual([
      ['Ana López', 'ana@padel.test', '600000000', 'Activo'],
      ['Bruno Gil', 'bruno@padel.test', '—', 'Inactivo'],
    ]);
    expect(element.querySelector('[data-testid="client-row"] a')?.getAttribute('href')).toBe('/42');
  });

  it('shows an empty state and the load error', () => {
    const element = render([]);
    facade.error.set('No se pudieron cargar los clientes.');
    fixture.detectChanges();

    expect(element.textContent).toContain('No hay clientes.');
    expect(element.querySelector('[data-testid="list-error"]')?.textContent?.trim()).toBe(
      'No se pudieron cargar los clientes.',
    );
  });

  it('searches by name, email or phone from the first page', () => {
    const element = render();
    const search = element.querySelector('[data-testid="search"]') as HTMLInputElement;

    search.value = '  ana ';
    search.dispatchEvent(new Event('input'));
    search.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));

    expect(facade.listClients).toHaveBeenLastCalledWith({ search: 'ana', page: 0 });
  });

  it('keeps the search when paging', () => {
    render();
    facade.filters.set({ search: 'ana' });

    fixture.componentInstance['changePage']({ pageIndex: 2, pageSize: 10, length: 50 });

    expect(facade.listClients).toHaveBeenLastCalledWith({ search: 'ana', page: 2, size: 10 });
  });

  it('opens the client modal empty to create, then confirms and refreshes', async () => {
    const element = render();
    dialogClosingWith({ ...ana, id: 44, name: 'Carla Ruiz' });

    click(element.querySelector('[data-testid="create"]'));
    await flush();

    expect(dialog.open).toHaveBeenCalledWith(
      ClientFormDialog,
      expect.objectContaining({ data: null }),
    );
    expect(snackBar.open).toHaveBeenCalledWith(
      'Cliente «Carla Ruiz» creado.',
      'OK',
      expect.anything(),
    );
    expect(facade.refresh).toHaveBeenCalled();
  });

  it('opens the same modal with the client to edit', async () => {
    const element = render();
    dialogClosingWith({ ...ana, phone: '611' });

    click(rowButton(element, 0, 'edit'));
    await flush();

    expect(dialog.open).toHaveBeenCalledWith(
      ClientFormDialog,
      expect.objectContaining({ data: ana }),
    );
    expect(snackBar.open).toHaveBeenCalledWith(
      'Cliente «Ana López» actualizado.',
      'OK',
      expect.anything(),
    );
    expect(facade.refresh).toHaveBeenCalled();
  });

  it('does nothing when the modal is cancelled', async () => {
    const element = render();
    dialogClosingWith(undefined);

    click(element.querySelector('[data-testid="create"]'));
    await flush();

    expect(snackBar.open).not.toHaveBeenCalled();
    expect(facade.refresh).not.toHaveBeenCalled();
  });

  it('deactivates a client only after confirming, then refreshes', async () => {
    const element = render();
    dialogClosingWith(true);

    click(rowButton(element, 0, 'deactivate'));
    await flush();

    expect(dialog.open).toHaveBeenCalledWith(
      ConfirmDialog,
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Dar de baja al cliente',
          confirmLabel: 'Dar de baja',
        }),
      }),
    );
    expect(facade.deleteClient).toHaveBeenCalledWith(42);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Cliente «Ana López» dado de baja.',
      'OK',
      expect.anything(),
    );
    expect(facade.refresh).toHaveBeenCalled();
  });

  it('does not deactivate when the confirmation is cancelled', async () => {
    const element = render();
    dialogClosingWith(false);

    click(rowButton(element, 0, 'deactivate'));
    await flush();

    expect(facade.deleteClient).not.toHaveBeenCalled();
  });

  it('cannot deactivate an inactive client', () => {
    const element = render();

    expect((rowButton(element, 1, 'deactivate') as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows a deactivation error and still refreshes', async () => {
    const element = render();
    dialogClosingWith(true);
    facade.deleteClient.mockRejectedValue(new ClientError('El cliente ya no existe.'));

    click(rowButton(element, 0, 'deactivate'));
    await flush();

    expect(snackBar.open).toHaveBeenCalledWith('El cliente ya no existe.', 'OK', expect.anything());
    expect(facade.refresh).toHaveBeenCalled();
  });
});
