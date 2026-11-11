import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideSpanishLocale } from '../../../core/locale/spanish-locale';
import { DashboardSummary } from '../../../shared/models';
import { DashboardFacade } from '../dashboard.facade';
import { DashboardPage } from './dashboard.page';

describe('DashboardPage', () => {
  const summary: DashboardSummary = {
    date: '2026-06-08',
    activeCourts: 4,
    bookingsToday: 12,
    upcomingBookings: 37,
    occupancyRate: 41.7,
    revenueToday: 192,
  };

  let facade: {
    summary: ReturnType<typeof signal<DashboardSummary | null>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    getDashboardSummary: ReturnType<typeof vi.fn>;
  };
  let fixture: ComponentFixture<DashboardPage>;

  function render(current: DashboardSummary | null = summary) {
    facade = {
      summary: signal(current),
      loading: signal(false),
      error: signal<string | null>(null),
      getDashboardSummary: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [provideSpanishLocale(), { provide: DashboardFacade, useValue: facade }],
    });
    fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const tiles = (element: HTMLElement) =>
    [...element.querySelectorAll('[data-testid="stat"]')].map((tile) => [
      tile.querySelector('[data-testid="stat-label"]')?.textContent?.trim(),
      tile.querySelector('[data-testid="stat-value"]')?.textContent?.trim(),
    ]);
  const click = (element: Element | null) => (element as HTMLButtonElement).click();

  it('loads the summary on start', () => {
    render();

    expect(facade.getDashboardSummary).toHaveBeenCalledTimes(1);
  });

  it("shows today's figures as stat tiles in Spanish", () => {
    const element = render();

    expect(element.querySelector('h1')?.textContent).toContain('Resumen de hoy');
    expect(element.querySelector('[data-testid="date"]')?.textContent?.trim()).toBe(
      'lunes, 8 de junio de 2026',
    );
    expect(tiles(element)).toEqual([
      ['Pistas activas', '4'],
      ['Reservas hoy', '12'],
      ['Próximos 7 días', '37'],
      ['Ocupación hoy', '41,7 %'],
      ['Ingresos hoy', '192,00\u00a0€'],
    ]);
  });

  it('shows a loading state while the summary loads', () => {
    const element = render(null);
    facade.loading.set(true);
    fixture.detectChanges();

    expect(element.querySelector('mat-progress-bar')).not.toBeNull();
    expect(element.textContent).toContain('Cargando resumen…');
    expect(tiles(element)).toEqual([]);
  });

  it('shows the error with a retry button', () => {
    const element = render(null);
    facade.error.set('No se pudo cargar el resumen.');
    fixture.detectChanges();

    expect(element.querySelector('[data-testid="load-error"]')?.textContent).toContain(
      'No se pudo cargar el resumen.',
    );
    click(element.querySelector('[data-testid="retry"]'));

    expect(facade.getDashboardSummary).toHaveBeenCalledTimes(2);
  });

  it('reloads on Actualizar', () => {
    const element = render();

    click(element.querySelector('[data-testid="refresh"]'));

    expect(facade.getDashboardSummary).toHaveBeenCalledTimes(2);
  });
});
