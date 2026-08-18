import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DetailActionsComponent } from './detail-actions.component';

describe('DetailActionsComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [DetailActionsComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(DetailActionsComponent);
    fixture.componentRef.setInput('actions', []);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
