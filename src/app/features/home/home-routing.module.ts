import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BibliographyComponent } from './pages/bibliography/bibliography.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';

const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
  },
  {
    path: 'bibliography',
    component: BibliographyComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule {}
