import { routes } from './app.routes';
import { ownerGuard } from './core/auth/owner.guard';

describe('app routes', () => {
  const shell = routes.find((route) => route.path === '' && route.children);

  it('serves the credit packs page inside the owner-guarded shell', async () => {
    expect(shell?.canActivate).toContain(ownerGuard);
    const creditPacks = shell?.children?.find((route) => route.path === 'credit-packs');
    expect(creditPacks?.loadChildren).toBeDefined();

    const children = (await (creditPacks!.loadChildren as () => Promise<unknown>)()) as {
      default: { path: string }[];
    };
    expect(children.default.map((route) => route.path)).toEqual(['']);
  });
});
