import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Auditpage } from './auditpage';

describe('Auditpage', () => {
  let component: Auditpage;
  let fixture: ComponentFixture<Auditpage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Auditpage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Auditpage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
