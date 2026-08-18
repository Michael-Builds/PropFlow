import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { httpTestProviders } from '../../testing/http';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: httpTestProviders(),
    });
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should mark all notifications as read', () => {
    service.markAllRead();
    expect(service.unreadCount()).toBe(0);
  });
});
