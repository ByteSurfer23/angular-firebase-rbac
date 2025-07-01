import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Assignuserproject } from './assignuserproject';

describe('Assignuserproject', () => {
  let component: Assignuserproject;
  let fixture: ComponentFixture<Assignuserproject>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Assignuserproject]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Assignuserproject);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
