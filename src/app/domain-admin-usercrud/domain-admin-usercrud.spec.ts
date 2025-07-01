import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DomainAdminUsercrud } from './domain-admin-usercrud';

describe('DomainAdminUsercrud', () => {
  let component: DomainAdminUsercrud;
  let fixture: ComponentFixture<DomainAdminUsercrud>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DomainAdminUsercrud]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DomainAdminUsercrud);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
