import { TestBed } from '@angular/core/testing';
import { AppearancePageComponent } from './appearance-page.component';

describe('AppearancePageComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [AppearancePageComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(AppearancePageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
