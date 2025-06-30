import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDomain } from './create-domain';

describe('CreateDomain', () => {
  let component: CreateDomain;
  let fixture: ComponentFixture<CreateDomain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateDomain]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateDomain);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
