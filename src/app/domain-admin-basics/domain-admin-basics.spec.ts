import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DomainAdminBasics } from './domain-admin-basics';

describe('DomainAdminBasics', () => {
  let component: DomainAdminBasics;
  let fixture: ComponentFixture<DomainAdminBasics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DomainAdminBasics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DomainAdminBasics);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
