import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { httpTestProviders } from './core/testing/http';

describe('App', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), ...httpTestProviders()],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
