import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { of } from 'rxjs';
import { APP_ICONS } from '../../core/icons/app-icons';
import { CollectionPageComponent } from './collection-page.component';

describe('CollectionPageComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionPageComponent],
      providers: [
        provideIcons(APP_ICONS),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { data: of({ collection: 'properties' }) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CollectionPageComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
