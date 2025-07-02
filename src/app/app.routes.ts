import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { AddRootUserComponent } from './add-root-user/add-root-user';
import { DashboardComponent } from './dashboard/dashboard';
import { Orgstats } from './orgstats/orgstats';
import { UserProductivityAnalyticsComponent } from './userstats/userstats';
import { AuditLogViewerComponent } from './auditpage/auditpage';
export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'root-signup', component: AddRootUserComponent },
  {path: 'dashboard' , component: DashboardComponent},
  { path: 'organalytics' , component: Orgstats},
  {path : 'useranalytics' , component : UserProductivityAnalyticsComponent},
  {path : 'auditlogs' , component : AuditLogViewerComponent}
];
