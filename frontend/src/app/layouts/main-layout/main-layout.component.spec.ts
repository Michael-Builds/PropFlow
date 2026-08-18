import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MainLayoutComponent } from './main-layout.component';

describe('MainLayoutComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(MainLayoutComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
