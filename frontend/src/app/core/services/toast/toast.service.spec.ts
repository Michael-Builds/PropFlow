import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should push a success toast', () => {
    service.success('Saved');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].variant).toBe('success');
  });

  it('should dismiss a toast by id', () => {
    const id = service.info('Hello');
    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
  });

  it('should clear all toasts', () => {
    service.success('One');
    service.error('Two');
    service.clear();
    expect(service.toasts().length).toBe(0);
  });
});
