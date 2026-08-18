import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoaderComponent } from './loader.component';
import { LoaderService } from '../../../core/services/loader/loader.service';

describe('LoaderComponent', () => {
  let fixture: ComponentFixture<LoaderComponent>;
  let loader: LoaderService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoaderComponent],
    }).compileComponents();

    loader = TestBed.inject(LoaderService);
    loader.reset();
    fixture = TestBed.createComponent(LoaderComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the global overlay when the service is showing', () => {
    loader.show('Loading control center...');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Loading control center...');
    expect(el.querySelector('.loader-global')).toBeTruthy();
  });
});
