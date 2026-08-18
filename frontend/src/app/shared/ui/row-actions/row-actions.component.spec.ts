import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RowActionsComponent } from './row-actions.component';

@Component({
  selector: 'app-row-actions-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RowActionsComponent],
  template: `<app-row-actions [actions]="actions" />`,
})
class RowActionsHostComponent {
  actions = [
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete', tone: 'danger' as const },
  ];
}

describe('RowActionsComponent', () => {
  it('should create', async () => {
    const { TestBed } = await import('@angular/core/testing');
    const { provideIcons } = await import('@ng-icons/core');
    const { APP_ICONS } = await import('../../../core/icons/app-icons');
    await TestBed.configureTestingModule({
      imports: [RowActionsHostComponent],
      providers: [provideIcons(APP_ICONS)],
    }).compileComponents();
    const fixture = TestBed.createComponent(RowActionsHostComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
