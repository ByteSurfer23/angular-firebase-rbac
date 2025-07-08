import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { AddRootUserComponent } from './add-root-user/add-root-user';
import { DashboardComponent } from './dashboard/dashboard';
import { UserProductivityAnalyticsComponent } from './userstats/userstats';
import { AuditLogViewerComponent } from './auditpage/auditpage';
import { UserLookupComponent } from './userdeets/userdeets';
export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'root-signup', component: AddRootUserComponent },
  {path: 'dashboard' , component: DashboardComponent},
  { path: 'organalytics' , component: UserLookupComponent},
  {path : 'useranalytics' , component : UserProductivityAnalyticsComponent},
  {path : 'auditlogs' , component : AuditLogViewerComponent}
];
