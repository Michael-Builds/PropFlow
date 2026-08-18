import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MainLayoutComponent } from './main-layout.component';
import { httpTestProviders } from '../../core/testing/http';

describe('MainLayoutComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [provideRouter([]), ...httpTestProviders()],
    }).compileComponents();
    const fixture = TestBed.createComponent(MainLayoutComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
