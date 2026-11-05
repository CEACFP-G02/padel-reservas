import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatRadioGroupHarness } from '@angular/material/radio/testing';
import { MatSelectHarness } from '@angular/material/select/testing';

import { Court, CourtType } from '../../../shared/models';
import { CourtError, CourtFacade } from '../court.facade';
import { CourtFormDialog } from './court-form.dialog';

describe('CourtFormDialog', () => {
  const court: Court = {
    id: 1,
    name: 'Pista 1',
    type: CourtType.GLASS,
    indoor: true,
    active: true,
  };

  let facade: { createCourt: ReturnType<typeof vi.fn>; updateCourt: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let loader: HarnessLoader;
  let element: HTMLElement;

  function open(data: Court | null) {
    facade = { createCourt: vi.fn(), updateCourt: vi.fn() };
    dialogRef = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [CourtFormDialog],
      providers: [
        { provide: CourtFacade, useValue: facade },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });
    const fixture = TestBed.createComponent(CourtFormDialog);
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
    element = fixture.nativeElement;
  }

  const nameInput = () =>
    loader.getHarness(MatInputHarness.with({ selector: '[formControlName="name"]' }));
  const save = async () =>
    (await loader.getHarness(MatButtonHarness.with({ text: 'Guardar' }))).click();
  const errorOf = async (label: string) =>
    (
      await loader.getHarness(MatFormFieldHarness.with({ floatingLabelText: label }))
    ).getTextErrors();
  const indoorErrors = () =>
    element.querySelector('[data-testid="indoor-error"]')?.textContent?.trim();

  async function fillCreateForm() {
    await (await nameInput()).setValue('  Pista 3 ');
    await (await loader.getHarness(MatSelectHarness)).clickOptions({ text: 'Muro' });
    await (await loader.getHarness(MatRadioGroupHarness)).checkRadioButton({ label: 'Cubierta' });
  }

  describe('create', () => {
    beforeEach(() => open(null));

    it('is titled for a new court, with type and indoor unset and active checked', async () => {
      expect(element.querySelector('h2')?.textContent).toContain('Nueva pista');
      expect(await (await nameInput()).getValue()).toBe('');
      expect(await (await loader.getHarness(MatSelectHarness)).getValueText()).toBe('');
      expect(await (await loader.getHarness(MatRadioGroupHarness)).getCheckedValue()).toBeNull();
      expect(
        await (await loader.getHarness(MatCheckboxHarness.with({ label: 'Activa' }))).isChecked(),
      ).toBe(true);
    });

    it('creates the court with the trimmed name and closes with it', async () => {
      const created: Court = {
        id: 3,
        name: 'Pista 3',
        type: CourtType.WALL,
        indoor: true,
        active: true,
      };
      facade.createCourt.mockResolvedValue(created);
      await fillCreateForm();

      await save();

      expect(facade.createCourt).toHaveBeenCalledWith({
        name: 'Pista 3',
        type: CourtType.WALL,
        indoor: true,
        active: true,
      });
      expect(dialogRef.close).toHaveBeenCalledWith(created);
    });

    it('does not submit an incomplete form and marks every missing field', async () => {
      await (await nameInput()).setValue('   ');

      await save();

      expect(facade.createCourt).not.toHaveBeenCalled();
      expect(await errorOf('Nombre')).toEqual(['El nombre es obligatorio.']);
      expect(await errorOf('Tipo')).toEqual(['Elige el tipo de pista.']);
      expect(indoorErrors()).toBe('Indica si la pista es cubierta o exterior.');
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('rejects a name longer than 100 characters', async () => {
      await (await nameInput()).setValue('x'.repeat(101));
      await (await nameInput()).blur();

      expect(await errorOf('Nombre')).toEqual(['Máximo 100 caracteres.']);
    });

    it('shows a duplicate name (409) on the name field and stays open until the name changes', async () => {
      facade.createCourt.mockRejectedValue(
        new CourtError('Ya existe una pista con ese nombre.', {
          name: 'Ya existe una pista con ese nombre.',
        }),
      );
      await fillCreateForm();

      await save();

      expect(await errorOf('Nombre')).toEqual(['Ya existe una pista con ese nombre.']);
      expect(dialogRef.close).not.toHaveBeenCalled();

      await (await nameInput()).setValue('Pista 4');
      expect(await errorOf('Nombre')).toEqual([]);
    });

    it('shows any other failure as a message in the dialog', async () => {
      facade.createCourt.mockRejectedValue(new CourtError('No se pudo guardar la pista.'));
      await fillCreateForm();

      await save();

      expect(element.querySelector('[data-testid="form-error"]')?.textContent?.trim()).toBe(
        'No se pudo guardar la pista.',
      );
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('closes without saving on Cancelar', async () => {
      await (await loader.getHarness(MatButtonHarness.with({ text: 'Cancelar' }))).click();

      expect(dialogRef.close).toHaveBeenCalledWith();
      expect(facade.createCourt).not.toHaveBeenCalled();
    });
  });

  describe('edit', () => {
    beforeEach(() => open(court));

    it('is titled for editing and prefilled with the court', async () => {
      expect(element.querySelector('h2')?.textContent).toContain('Editar pista');
      expect(await (await nameInput()).getValue()).toBe('Pista 1');
      expect(await (await loader.getHarness(MatSelectHarness)).getValueText()).toBe('Cristal');
      expect(await (await loader.getHarness(MatRadioGroupHarness)).getCheckedValue()).toBe('true');
    });

    it('PATCHes only the changed fields and closes with the updated court', async () => {
      const updated = { ...court, indoor: false, active: false };
      facade.updateCourt.mockResolvedValue(updated);
      await (await nameInput()).setValue(' Pista 1 ');
      await (await loader.getHarness(MatRadioGroupHarness)).checkRadioButton({ label: 'Exterior' });
      await (await loader.getHarness(MatCheckboxHarness.with({ label: 'Activa' }))).uncheck();

      await save();

      expect(facade.updateCourt).toHaveBeenCalledWith(1, { indoor: false, active: false });
      expect(dialogRef.close).toHaveBeenCalledWith(updated);
    });

    it('closes without a request when nothing changed', async () => {
      await save();

      expect(facade.updateCourt).not.toHaveBeenCalled();
      expect(dialogRef.close).toHaveBeenCalledWith();
    });

    it('shows a duplicate name (409) on the name field', async () => {
      facade.updateCourt.mockRejectedValue(
        new CourtError('Ya existe una pista con ese nombre.', {
          name: 'Ya existe una pista con ese nombre.',
        }),
      );
      await (await nameInput()).setValue('Pista 2');

      await save();

      expect(facade.updateCourt).toHaveBeenCalledWith(1, { name: 'Pista 2' });
      expect(await errorOf('Nombre')).toEqual(['Ya existe una pista con ese nombre.']);
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });
});
