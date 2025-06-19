import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { CustomizationService } from '../services/customization';
import { Customization } from '../customization';

@Injectable({
  providedIn: 'root',
})
export class CustomizationGuard implements CanActivate {
  constructor(
    private customizationService: CustomizationService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const customization: Customization = this.customizationService.getCustomization();
    const flag = route.data['customizationFlag'] as keyof Customization;

    if (customization[flag]) {
      return true;
    }

    this.router.navigate(['/unauthorized']);
    return false;
  }
}
