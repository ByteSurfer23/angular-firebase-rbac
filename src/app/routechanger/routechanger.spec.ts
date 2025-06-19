import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Routechanger } from './routechanger';

describe('Routechanger', () => {
  let component: Routechanger;
  let fixture: ComponentFixture<Routechanger>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Routechanger]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Routechanger);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
