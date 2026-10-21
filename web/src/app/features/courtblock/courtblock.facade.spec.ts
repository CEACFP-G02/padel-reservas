import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CourtBlockFacade } from './courtblock.facade';

describe('CourtBlockFacade', () => {
  let facade: CourtBlockFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    facade = TestBed.inject(CourtBlockFacade);
  });

  it('starts with empty state', () => {
    expect(facade.blocks()).toEqual([]);
    expect(facade.loading()).toBe(false);
  });

  it.todo('listBlocks loads the court blocks');
  it.todo('createBlock appends the created block');
  it.todo('removeBlock deletes /court-blocks/{id} and drops the block');
});
