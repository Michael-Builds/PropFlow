import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { of } from 'rxjs';
import { APP_ICONS } from '../../../core/icons/app-icons';
import { CollectionDetailPageComponent } from './collection-detail-page.component';

describe('CollectionDetailPageComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionDetailPageComponent],
      providers: [
        provideIcons(APP_ICONS),
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ collection: 'properties' }),
            snapshot: { paramMap: { get: () => 'prp_001' } },
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CollectionDetailPageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
