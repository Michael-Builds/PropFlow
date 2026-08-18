import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotFoundPageComponent } from './not-found-page.component';

describe('NotFoundPageComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(NotFoundPageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
