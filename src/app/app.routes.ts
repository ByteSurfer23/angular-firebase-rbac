import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { AddRootUserComponent } from './add-root-user/add-root-user';
import { DashboardComponent } from './dashboard/dashboard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'root-signup', component: AddRootUserComponent },
  {path: 'dashboard' , component: DashboardComponent}
];
