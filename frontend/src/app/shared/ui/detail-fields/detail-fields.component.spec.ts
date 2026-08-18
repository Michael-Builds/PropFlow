import { TestBed } from '@angular/core/testing';
import { DetailFieldsComponent } from './detail-fields.component';

describe('DetailFieldsComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [DetailFieldsComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(DetailFieldsComponent);
    fixture.componentRef.setInput('fields', [{ label: 'Code', kind: 'text', value: 'prp_001' }]);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
