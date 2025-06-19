import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-custom-buttons',
  templateUrl: './routechanger.html',
  styleUrls: ['./routechanger.scss'],
  imports: [CommonModule]
})
export class CustomButtonsComponent {
  @Input() customization = {
    userAnalytics: false,
    orgAnalytics: false,
    auditLog: false
  };

  constructor(private router: Router) {}

  goTo(route: string) {
    this.router.navigate([`/${route}`]);
  }
}
