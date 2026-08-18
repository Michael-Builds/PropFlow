import { TestBed } from '@angular/core/testing';
import { ModalService } from './modal.service';

describe('ModalService', () => {
  let service: ModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should open a confirm modal', async () => {
    const promise = service.confirm({
      title: 'Delete?',
      message: 'This cannot be undone.',
    });

    expect(service.modals().length).toBe(1);
    const id = service.modals()[0].id;
    service.close(id, true);

    await expect(promise).resolves.toBe(true);
    expect(service.modals().length).toBe(0);
  });

  it('should close all modals', () => {
    void service.confirm({ title: 'A', message: 'B' });
    void service.confirm({ title: 'C', message: 'D' });
    service.closeAll();
    expect(service.modals().length).toBe(0);
  });
});
