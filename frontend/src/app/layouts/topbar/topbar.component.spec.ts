import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TopbarComponent } from './topbar.component';

describe('TopbarComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(TopbarComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
