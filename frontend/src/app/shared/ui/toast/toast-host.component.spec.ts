import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastHostComponent } from './toast-host.component';

describe('ToastHostComponent', () => {
  let fixture: ComponentFixture<ToastHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastHostComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
