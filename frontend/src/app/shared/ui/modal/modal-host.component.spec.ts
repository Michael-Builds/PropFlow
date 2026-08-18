import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalHostComponent } from './modal-host.component';

describe('ModalHostComponent', () => {
  let fixture: ComponentFixture<ModalHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalHostComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
