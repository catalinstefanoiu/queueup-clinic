import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientQueue } from './patient-queue';

describe('PatientQueue', () => {
  let component: PatientQueue;
  let fixture: ComponentFixture<PatientQueue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientQueue],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientQueue);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
