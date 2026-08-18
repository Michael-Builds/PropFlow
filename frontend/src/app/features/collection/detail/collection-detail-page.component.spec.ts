import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { of } from 'rxjs';
import { APP_ICONS } from '../../../core/icons/app-icons';
import { CollectionDetailPageComponent } from './collection-detail-page.component';
import { httpTestProviders } from '../../../core/testing/http';

describe('CollectionDetailPageComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionDetailPageComponent],
      providers: [
        provideIcons(APP_ICONS),
        provideRouter([]),
        ...httpTestProviders(),
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ collection: 'properties' }),
            paramMap: of(convertToParamMap({ id: 'prp_001' })),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CollectionDetailPageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
