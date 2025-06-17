import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Userstats } from './userstats';

describe('Userstats', () => {
  let component: Userstats;
  let fixture: ComponentFixture<Userstats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Userstats]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Userstats);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
