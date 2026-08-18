import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(LoginPageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
