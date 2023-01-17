import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QcLoginComponent } from '@shared/components/qc-login/qc-login.component';
import { NoahPlaygroundComponent } from './pages/noah-playground/noah-playground.component';

const routes: Routes = [
  {
    path: '',
    component: NoahPlaygroundComponent,
    children: [
      {
        path: 'noah-qc-login',
        component: QcLoginComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NoahPlaygroundRoutingModule {}
