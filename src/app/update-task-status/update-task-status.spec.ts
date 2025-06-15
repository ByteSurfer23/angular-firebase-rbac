import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateTaskStatus } from './update-task-status';

describe('UpdateTaskStatus', () => {
  let component: UpdateTaskStatus;
  let fixture: ComponentFixture<UpdateTaskStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateTaskStatus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateTaskStatus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
