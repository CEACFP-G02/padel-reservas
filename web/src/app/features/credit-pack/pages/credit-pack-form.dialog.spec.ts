import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';

import { provideSpanishLocale } from '../../../core/locale/spanish-locale';
import { CreditPackError, CreditPackFacade, CreditPackRow } from '../credit-pack.facade';
import { CreditPackFormDialog } from './credit-pack-form.dialog';

const PRICE_RULE = 'El precio debe ser mayor o igual que 0, con 2 decimales como máximo.';

describe('CreditPackFormDialog', () => {
  const pack: CreditPackRow = { id: 2, size: 10, price: 140, pricePerReservation: 14 };

  let facade: { updatePrice: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let loader: HarnessLoader;
  let element: HTMLElement;

  beforeEach(() => {
    facade = { updatePrice: vi.fn() };
    dialogRef = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [CreditPackFormDialog],
      providers: [
        provideSpanishLocale(),
        { provide: CreditPackFacade, useValue: facade },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: pack },
      ],
    });
    const fixture = TestBed.createComponent(CreditPackFormDialog);
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
    element = fixture.nativeElement;
  });

  const priceInput = () => loader.getHarness(MatInputHarness);
  const save = async () =>
    (await loader.getHarness(MatButtonHarness.with({ text: 'Guardar' }))).click();
  const priceErrors = async () =>
    (
      await loader.getHarness(
        MatFormFieldHarness.with({ floatingLabelText: 'Precio del pack (€)' }),
      )
    ).getTextErrors();

  it('shows the pack size read-only and the price prefilled', async () => {
    expect(element.querySelector('h2')?.textContent).toContain('Editar precio del pack');
    expect(element.querySelector('[data-testid="size"]')?.textContent?.trim()).toBe('10 reservas');
    expect(await loader.getAllHarnesses(MatInputHarness)).toHaveLength(1);
    expect(await (await priceInput()).getValue()).toBe('140');
  });

  it('shows the price per reservation as the price is typed', async () => {
    await (await priceInput()).setValue('130');

    expect(element.querySelector('[data-testid="per-reservation"]')?.textContent).toContain(
      '13,00 € por reserva',
    );
  });

  it('saves the new price and closes with the saved pack', async () => {
    const saved = { id: 2, size: 10, price: 130.5 };
    facade.updatePrice.mockResolvedValue(saved);
    await (await priceInput()).setValue('130.5');

    await save();

    expect(facade.updatePrice).toHaveBeenCalledWith(2, 130.5);
    expect(dialogRef.close).toHaveBeenCalledWith(saved);
  });

  it('accepts a price of 0', async () => {
    facade.updatePrice.mockResolvedValue({ id: 2, size: 10, price: 0 });
    await (await priceInput()).setValue('0');

    await save();

    expect(facade.updatePrice).toHaveBeenCalledWith(2, 0);
  });

  it('closes without saving when the price did not change', async () => {
    await save();

    expect(facade.updatePrice).not.toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });

  it.each([
    ['', 'El precio es obligatorio.'],
    ['-1', PRICE_RULE],
    ['130.555', PRICE_RULE],
    ['1000000', 'El precio no puede superar 999.999,99 €.'],
  ])('rejects the price %j', async (price, message) => {
    await (await priceInput()).setValue(price);

    await save();

    expect(await priceErrors()).toEqual([message]);
    expect(facade.updatePrice).not.toHaveBeenCalled();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('shows a 400 from the API on the price field and stays open', async () => {
    facade.updatePrice.mockRejectedValue(
      new CreditPackError('Revisa el precio del pack.', { price: PRICE_RULE }),
    );
    await (await priceInput()).setValue('130');

    await save();

    expect(await priceErrors()).toEqual([PRICE_RULE]);
    expect(element.querySelector('[data-testid="form-error"]')).toBeNull();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('shows any other failure as a message in the dialog', async () => {
    facade.updatePrice.mockRejectedValue(new CreditPackError('El pack ya no existe.'));
    await (await priceInput()).setValue('130');

    await save();

    expect(element.querySelector('[data-testid="form-error"]')?.textContent?.trim()).toBe(
      'El pack ya no existe.',
    );
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('closes without saving on Cancelar', async () => {
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Cancelar' }))).click();

    expect(dialogRef.close).toHaveBeenCalledWith();
    expect(facade.updatePrice).not.toHaveBeenCalled();
  });
});
