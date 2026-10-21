import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { PageResponse } from '../shared/models';

export const API = environment.apiBaseUrl;

/** Configures TestBed with a mocked backend; returns the controller to flush requests. */
export function setUpHttp(): HttpTestingController {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  return TestBed.inject(HttpTestingController);
}

export function pageOf<T>(content: T[], page = 0, size = 20): PageResponse<T> {
  return { content, page, size, totalElements: content.length, totalPages: 1 };
}
