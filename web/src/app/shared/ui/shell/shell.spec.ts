import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatPaginatorModule } from '@angular/material/paginator';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { Shell } from './shell';

@Component({
  imports: [MatPaginatorModule],
  template: `<mat-paginator [length]="45" [pageSize]="20" [pageSizeOptions]="[10, 20]" />`,
})
class TablePage {}

describe('Shell', () => {
  async function renderInShell(): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: '', component: Shell, children: [{ path: 'table', component: TablePage }] },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create('/table');
    harness.fixture.detectChanges();
    await harness.fixture.whenStable();
    return harness.fixture.nativeElement as HTMLElement;
  }

  it('shows every paginator of its pages in Spanish', async () => {
    const element = await renderInShell();
    const paginator = element.querySelector('mat-paginator');

    expect(paginator?.textContent).toContain('Elementos por página');
    expect(paginator?.textContent).toContain('1–20 de 45');
    expect(paginator?.querySelector('button[aria-label="Página siguiente"]')).not.toBeNull();
    expect(paginator?.querySelector('button[aria-label="Página anterior"]')).not.toBeNull();
  });
});
