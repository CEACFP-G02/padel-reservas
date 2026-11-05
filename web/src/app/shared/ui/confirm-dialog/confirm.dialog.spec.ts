import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ConfirmDialog, ConfirmDialogData } from './confirm.dialog';

describe('ConfirmDialog', () => {
  const data: ConfirmDialogData = {
    title: 'Desactivar pista',
    message: 'La pista dejará de admitir reservas.',
    confirmLabel: 'Desactivar',
  };

  function render() {
    const dialogRef = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });
    const fixture = TestBed.createComponent(ConfirmDialog);
    fixture.detectChanges();
    return { element: fixture.nativeElement as HTMLElement, dialogRef };
  }

  it('shows the title, the message and the confirm label', () => {
    const { element } = render();

    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Desactivar pista');
    expect(element.textContent).toContain('La pista dejará de admitir reservas.');
    expect(element.querySelector('[data-testid="confirm"]')?.textContent?.trim()).toBe(
      'Desactivar',
    );
  });

  it('closes with true on confirm', () => {
    const { element, dialogRef } = render();

    (element.querySelector('[data-testid="confirm"]') as HTMLButtonElement).click();

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('closes with false on Cancelar', () => {
    const { element, dialogRef } = render();

    (element.querySelector('[data-testid="cancel"]') as HTMLButtonElement).click();

    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });
});
