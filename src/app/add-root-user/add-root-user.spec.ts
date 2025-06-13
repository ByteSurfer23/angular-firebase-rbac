import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRootUser } from './add-root-user';

describe('AddRootUser', () => {
  let component: AddRootUser;
  let fixture: ComponentFixture<AddRootUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddRootUser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddRootUser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
