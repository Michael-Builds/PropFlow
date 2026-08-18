import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormDialogComponent } from './form-dialog.component';

describe('FormDialogComponent', () => {
  let fixture: ComponentFixture<FormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormDialogComponent);
    fixture.componentRef.setInput('title', 'Test dialog');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
