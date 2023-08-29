import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SearchComponent } from './components/search/search.component';
import { ArrowKeysDirective } from './arrow-keys.directive';
import { BannerComponent } from './components/banner/banner.component';
import { ReplacePipe } from './pipes/replace.pipe';
import { ChangeStyleButtonComponent } from './components/change-style-button/change-style-button.component';
import { DisclaimerComponent } from './components/disclaimer/disclaimer.component';
import { SummaryComponent } from './components/summary/summary.component';
import { LoginComponent } from './components/login/login.component';
import { SortPipe } from './pipes/sort.pipe';
import { SearchfilterPipe } from './pipes/searchfilter.pipe';
import { PaginationComponent } from './components/pagination/pagination.component';
import { AlertComponent } from './components/alert/alert.component';
import { QcLoginComponent } from './components/qc-login/qc-login.component';
import { RiskAssessmentModalComponent } from './components/risk-assessment-modal/risk-assessment-modal.component';
import { RiskAssessmentSummaryComponent } from './components/risk-assessment-summary/risk-assessment-summary.component';
import { RiskAssessmentNeedsComponent } from './components/risk-assessment-needs/risk-assessment-needs.component';

const modules = [CommonModule, FormsModule, ReactiveFormsModule];
const components = [
  ChangeStyleButtonComponent,
  SearchComponent,
  BannerComponent,
  DisclaimerComponent,
  SummaryComponent,
  LoginComponent,
  QcLoginComponent,
  PaginationComponent,
  AlertComponent,
  RiskAssessmentModalComponent,
  RiskAssessmentSummaryComponent,
  RiskAssessmentNeedsComponent,
];
const directives = [];
const pipes = [ReplacePipe, SortPipe, SearchfilterPipe];
@NgModule({
  declarations: [...components, ...directives, ...pipes],
  imports: [...modules],
  exports: [...modules, ...components, ...directives, ...pipes],
})
export class SharedModule {}
