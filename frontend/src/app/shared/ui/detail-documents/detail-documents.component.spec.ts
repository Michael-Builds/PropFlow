import { TestBed } from '@angular/core/testing';
import { DetailDocumentsComponent } from './detail-documents.component';

describe('DetailDocumentsComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [DetailDocumentsComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(DetailDocumentsComponent);
    fixture.componentRef.setInput('documents', []);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
