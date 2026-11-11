import { navItems } from './nav-items';

const labels = (url: string) => navItems(url).map((item) => item.label);
const active = (url: string) =>
  navItems(url)
    .filter((item) => item.active)
    .map((item) => item.label);
const linkOf = (url: string, label: string) =>
  navItems(url).find((item) => item.label === label)?.link;

describe('navItems', () => {
  it('lists the admin sections in order', () => {
    expect(labels('/dashboard')).toEqual([
      'Dashboard',
      'Pistas',
      'Horarios',
      'Ocupación',
      'Clientes',
      'Bloqueos',
      'Reservas',
    ]);
  });

  it('highlights the section of the current url, ignoring query and fragment', () => {
    expect(active('/dashboard')).toEqual(['Dashboard']);
    expect(active('/clients/7?tab=1')).toEqual(['Clientes']);
    expect(active('/bookings/3#x')).toEqual(['Reservas']);
    expect(active('/availability')).toEqual(['Ocupación']);
  });

  it('highlights Pistas on the court list and a court detail only', () => {
    expect(active('/courts')).toEqual(['Pistas']);
    expect(active('/courts/4')).toEqual(['Pistas']);
    expect(active('/courts/4/schedule')).toEqual(['Horarios']);
    expect(active('/courts/4/blocks')).toEqual(['Bloqueos']);
  });

  it('sends Horarios and Bloqueos to the court list to pick a court when none is in context', () => {
    expect(linkOf('/dashboard', 'Horarios')).toBe('/courts');
    expect(linkOf('/dashboard', 'Bloqueos')).toBe('/courts');
  });

  it('links Horarios and Bloqueos to the court in context', () => {
    for (const url of ['/courts/4', '/courts/4/schedule', '/courts/4/blocks']) {
      expect(linkOf(url, 'Horarios')).toBe('/courts/4/schedule');
      expect(linkOf(url, 'Bloqueos')).toBe('/courts/4/blocks');
    }
  });

  it('does not highlight a section on a prefix that is not a path segment', () => {
    expect(active('/courtsx')).toEqual([]);
  });
});
