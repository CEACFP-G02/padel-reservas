import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';

import { Client } from '../../../shared/models';
import { ClientError, UserFacade } from '../user.facade';
import { ClientFormDialog } from './client-form.dialog';

describe('ClientFormDialog', () => {
  const ana: Client = {
    id: 42,
    name: 'Ana López',
    email: 'ana@padel.test',
    phone: '600000000',
    active: false,
  };

  let facade: { createClient: ReturnType<typeof vi.fn>; updateClient: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let loader: HarnessLoader;
  let element: HTMLElement;

  function open(data: Client | null) {
    facade = { createClient: vi.fn(), updateClient: vi.fn() };
    dialogRef = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ClientFormDialog],
      providers: [
        { provide: UserFacade, useValue: facade },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });
    const fixture = TestBed.createComponent(ClientFormDialog);
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
    element = fixture.nativeElement;
  }

  const input = (name: string) =>
    loader.getHarness(MatInputHarness.with({ selector: `[formControlName="${name}"]` }));
  const inputs = (name: string) =>
    loader.getAllHarnesses(MatInputHarness.with({ selector: `[formControlName="${name}"]` }));
  const fill = async (name: string, value: string) => (await input(name)).setValue(value);
  const save = async () =>
    (await loader.getHarness(MatButtonHarness.with({ text: 'Guardar' }))).click();
  const errorOf = async (label: string) =>
    (
      await loader.getHarness(MatFormFieldHarness.with({ floatingLabelText: label }))
    ).getTextErrors();

  describe('create', () => {
    beforeEach(() => open(null));

    it('is titled for a new client and asks for a password, without the active checkbox', async () => {
      expect(element.querySelector('h2')?.textContent).toContain('Nuevo cliente');
      expect(await inputs('password')).toHaveLength(1);
      expect(await loader.getAllHarnesses(MatCheckboxHarness)).toHaveLength(0);
    });

    it('validates in Spanish and does not save an invalid form', async () => {
      await fill('name', '   ');
      await fill('email', 'no-es-un-email');
      await fill('password', 'corta');
      await fill('phone', '6'.repeat(31));
      await save();

      expect(await errorOf('Nombre')).toEqual(['El nombre es obligatorio.']);
      expect(await errorOf('Email')).toEqual(['Introduce un email válido.']);
      expect(await errorOf('Contraseña')).toEqual(['Mínimo 8 caracteres.']);
      expect(await errorOf('Teléfono')).toEqual(['Máximo 30 caracteres.']);
      expect(facade.createClient).not.toHaveBeenCalled();
    });

    it('requires name, email and password', async () => {
      await save();

      expect(await errorOf('Nombre')).toEqual(['El nombre es obligatorio.']);
      expect(await errorOf('Email')).toEqual(['El email es obligatorio.']);
      expect(await errorOf('Contraseña')).toEqual(['La contraseña es obligatoria.']);
    });

    it('creates the client with trimmed values and no phone when left empty, and closes with it', async () => {
      const created: Client = {
        id: 44,
        name: 'Carla Ruiz',
        email: 'carla@padel.test',
        phone: null,
        active: true,
      };
      facade.createClient.mockResolvedValue(created);
      await fill('name', '  Carla Ruiz ');
      await fill('email', ' carla@padel.test ');
      await fill('password', 's3cret-pass');
      await save();

      expect(facade.createClient).toHaveBeenCalledWith({
        name: 'Carla Ruiz',
        email: 'carla@padel.test',
        password: 's3cret-pass',
      });
      expect(dialogRef.close).toHaveBeenCalledWith(created);
    });

    it('shows a duplicate email (409) on the email field and stays open', async () => {
      facade.createClient.mockRejectedValue(
        new ClientError('Revisa los datos del cliente.', {
          email: 'Ya existe un usuario con ese email.',
        }),
      );
      await fill('name', 'Carla Ruiz');
      await fill('email', 'ana@padel.test');
      await fill('password', 's3cret-pass');
      await save();

      expect(await errorOf('Email')).toEqual(['Ya existe un usuario con ese email.']);
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('shows 400 field errors from the API on their fields', async () => {
      facade.createClient.mockRejectedValue(
        new ClientError('Revisa los datos del cliente.', {
          password: 'La contraseña debe tener entre 8 y 72 caracteres.',
        }),
      );
      await fill('name', 'Carla Ruiz');
      await fill('email', 'carla@padel.test');
      await fill('password', 's3cret-pass');
      await save();

      expect(await errorOf('Contraseña')).toEqual([
        'La contraseña debe tener entre 8 y 72 caracteres.',
      ]);
    });

    it('shows any other failure as a form message', async () => {
      facade.createClient.mockRejectedValue(new ClientError('No se pudo guardar el cliente.'));
      await fill('name', 'Carla Ruiz');
      await fill('email', 'carla@padel.test');
      await fill('password', 's3cret-pass');
      await save();

      expect(element.querySelector('[data-testid="form-error"]')?.textContent?.trim()).toBe(
        'No se pudo guardar el cliente.',
      );
    });
  });

  describe('edit', () => {
    beforeEach(() => open(ana));

    it('is prefilled, without password, and with the active checkbox', async () => {
      expect(element.querySelector('h2')?.textContent).toContain('Editar cliente');
      expect(await (await input('name')).getValue()).toBe('Ana López');
      expect(await (await input('email')).getValue()).toBe('ana@padel.test');
      expect(await (await input('phone')).getValue()).toBe('600000000');
      expect(await inputs('password')).toHaveLength(0);
      expect(
        await (await loader.getHarness(MatCheckboxHarness.with({ label: 'Activo' }))).isChecked(),
      ).toBe(false);
    });

    it('sends only the changed fields (an emptied phone clears it, checking Activo reactivates)', async () => {
      const saved = { ...ana, name: 'Ana López Ruiz', phone: null, active: true };
      facade.updateClient.mockResolvedValue(saved);
      await fill('name', 'Ana López Ruiz ');
      await fill('phone', '');
      await (await loader.getHarness(MatCheckboxHarness.with({ label: 'Activo' }))).check();
      await save();

      expect(facade.updateClient).toHaveBeenCalledWith(42, {
        name: 'Ana López Ruiz',
        phone: '',
        active: true,
      });
      expect(dialogRef.close).toHaveBeenCalledWith(saved);
    });

    it('closes without saving when nothing changed', async () => {
      await save();

      expect(facade.updateClient).not.toHaveBeenCalled();
      expect(dialogRef.close).toHaveBeenCalledWith();
    });

    it('shows an email in use (409) on the email field', async () => {
      facade.updateClient.mockRejectedValue(
        new ClientError('Revisa los datos del cliente.', {
          email: 'Ya existe un usuario con ese email.',
        }),
      );
      await fill('email', 'bruno@padel.test');
      await save();

      expect(await errorOf('Email')).toEqual(['Ya existe un usuario con ese email.']);
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  it('closes empty on Cancelar', async () => {
    open(null);

    await (await loader.getHarness(MatButtonHarness.with({ text: 'Cancelar' }))).click();

    expect(dialogRef.close).toHaveBeenCalledWith();
    expect(facade.createClient).not.toHaveBeenCalled();
  });
});
