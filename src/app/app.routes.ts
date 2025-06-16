import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { AddRootUserComponent } from './add-root-user/add-root-user';
import { DashboardComponent } from './dashboard/dashboard';
import { EditTaskComponent } from './edit-task/edit-task';
import { Orgstats } from './orgstats/orgstats';
export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'root-signup', component: AddRootUserComponent },
  {path: 'dashboard' , component: DashboardComponent},
  { path: 'tasks', component: DashboardComponent },
  { path: 'edit-task/:id', component: EditTaskComponent },
  { path: 'organalytics' , component: Orgstats}
];
