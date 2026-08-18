import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { DataTableComponent } from './data-table.component';
import { APP_ICONS } from '../../../core/icons/app-icons';

describe('DataTableComponent', () => {
  let fixture: ComponentFixture<DataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableComponent],
      providers: [provideIcons(APP_ICONS)],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTableComponent);
    fixture.componentRef.setInput('columns', [{ key: 'name', header: 'Name' }]);
    fixture.componentRef.setInput('data', [{ id: '1', name: 'Sample' }]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
