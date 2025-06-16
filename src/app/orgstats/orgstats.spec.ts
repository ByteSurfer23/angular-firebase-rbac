import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Orgstats } from './orgstats';

describe('Orgstats', () => {
  let component: Orgstats;
  let fixture: ComponentFixture<Orgstats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Orgstats]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Orgstats);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
