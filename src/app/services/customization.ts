import { Injectable } from '@angular/core';
import { Customization } from '../customization';

@Injectable({
  providedIn: 'root'
})
export class CustomizationService {
  getCustomization(): Customization {
    const customizationString = localStorage.getItem('customization');
    if (!customizationString) {
      // Return all false if not found
      return {
        auditLog: false,
        userAnalytics: false,
        orgAnalytics: false,
      };
    }

    try {
      const parsed = JSON.parse(customizationString);
      return {
        auditLog: parsed.auditLog ?? false,
        userAnalytics: parsed.userAnalytics ?? false,
        orgAnalytics: parsed.orgAnalytics ?? false,
      };
    } catch (e) {
      // In case of invalid JSON
      return {
        auditLog: false,
        userAnalytics: false,
        orgAnalytics: false,
      };
    }
  }
}
export type { Customization };

