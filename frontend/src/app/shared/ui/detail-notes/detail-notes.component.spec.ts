import { TestBed } from '@angular/core/testing';
import { DetailNotesComponent } from './detail-notes.component';

describe('DetailNotesComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [DetailNotesComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(DetailNotesComponent);
    fixture.componentRef.setInput('notes', []);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
