import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Userdeets } from './userdeets';

describe('Userdeets', () => {
  let component: Userdeets;
  let fixture: ComponentFixture<Userdeets>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Userdeets]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Userdeets);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
