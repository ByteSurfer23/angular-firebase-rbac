import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAdmin } from './user-admin';

describe('UserAdmin', () => {
  let component: UserAdmin;
  let fixture: ComponentFixture<UserAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
