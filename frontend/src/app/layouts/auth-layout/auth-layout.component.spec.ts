import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthLayoutComponent } from './auth-layout.component';

describe('AuthLayoutComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [AuthLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(AuthLayoutComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
