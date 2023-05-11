import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SearchComponent } from './components/search/search.component';
import { ArrowKeysDirective } from './arrow-keys.directive';
import { BannerComponent } from './components/banner/banner.component';
import { ReplacePipe } from './pipes/replace.pipe';
import { ChangeStyleButtonComponent } from './components/change-style-button/change-style-button.component';
import { RiskAssessmentModalComponent } from './components/risk-assessment-modal/risk-assessment-modal.component';
import { RiskAssessmentSummaryComponent } from './components/risk-assessment-summary/risk-assessment-summary.component';
import { RiskAssessmentNeedsComponent } from './components/risk-assessment-needs/risk-assessment-needs.component';

const modules = [CommonModule, FormsModule, ReactiveFormsModule];
const components = [
  ChangeStyleButtonComponent,
  SearchComponent,
  BannerComponent,
  RiskAssessmentModalComponent,
  RiskAssessmentSummaryComponent,
  RiskAssessmentNeedsComponent,
];
const directives = [];
const pipes = [ReplacePipe];
@NgModule({
  declarations: [...components, ...directives, ...pipes],
  imports: [...modules],
  exports: [...modules, ...components, ...directives, ...pipes],
})
export class SharedModule {}
