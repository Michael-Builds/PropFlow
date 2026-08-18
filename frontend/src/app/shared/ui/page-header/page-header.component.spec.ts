import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PageHeaderComponent);
    fixture.componentRef.setInput('title', 'Test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
