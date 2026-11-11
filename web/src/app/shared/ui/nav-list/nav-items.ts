export interface NavItem {
  label: string;
  icon: string;
  link: string;
  active: boolean;
}

const COURT_URL = /^\/courts\/([^/]+)(?:\/(schedule|blocks))?$/;

/**
 * Side-navigation entries for the current url. Schedules and blocks belong to a court, so their
 * entries open the court in context (or the court list, to pick one).
 */
export function navItems(url: string): NavItem[] {
  const path = url.split(/[?#]/)[0];
  const court = COURT_URL.exec(path);
  const courtId = court?.[1];
  const courtSection = court?.[2];
  const within = (link: string) => path === link || path.startsWith(`${link}/`);

  return [
    {
      label: 'Dashboard',
      icon: 'space_dashboard',
      link: '/dashboard',
      active: within('/dashboard'),
    },
    {
      label: 'Pistas',
      icon: 'sports_tennis',
      link: '/courts',
      active: within('/courts') && !courtSection,
    },
    {
      label: 'Horarios',
      icon: 'schedule',
      link: courtId ? `/courts/${courtId}/schedule` : '/courts',
      active: courtSection === 'schedule',
    },
    {
      label: 'Ocupación',
      icon: 'calendar_month',
      link: '/availability',
      active: within('/availability'),
    },
    { label: 'Clientes', icon: 'group', link: '/clients', active: within('/clients') },
    {
      label: 'Bloqueos',
      icon: 'event_busy',
      link: courtId ? `/courts/${courtId}/blocks` : '/courts',
      active: courtSection === 'blocks',
    },
    { label: 'Reservas', icon: 'event', link: '/bookings', active: within('/bookings') },
    {
      label: 'Packs de crédito',
      icon: 'loyalty',
      link: '/credit-packs',
      active: within('/credit-packs'),
    },
  ];
}
