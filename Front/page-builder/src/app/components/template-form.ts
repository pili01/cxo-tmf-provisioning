import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';
import { TemplateService } from '../services/template';
import { ApiService } from '../services/api';
import { PageTemplate, TemplateCategory, PortfolioProjectItem, TemplateField } from '../models/template.model';

@Component({
  selector: 'app-template-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './template-form.html',
  styleUrl: './template-form.scss'
})
export class TemplateForm implements OnInit {
  categoryId = '';
  templateId = '';
  category?: TemplateCategory;
  template?: PageTemplate;
  emailField?: TemplateField;
  formValues: Record<string, string> = {};
  readonly loading = signal(true);
  deploying = false;
  deploySuccess = false;
  deployError = '';
  showPreview = false;
  previewHtml: SafeHtml = '';
  /** Portfolio only: dynamic project rows (synced to `formValues['projects']` as JSON). */
  portfolioProjects: PortfolioProjectItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private templateService: TemplateService,
    private apiService: ApiService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.categoryId = this.route.snapshot.params['categoryId'];
    this.templateId = this.route.snapshot.params['templateId'];
    this.category = this.templateService.getCategoryById(this.categoryId);

    if (!this.category) {
      this.loading.set(false);
      this.router.navigate(['/']);
      return;
    }

    this.templateService.getTemplateById(this.categoryId, this.templateId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (template) => {
          if (!template) {
            this.router.navigate(['/templates', this.categoryId]);
            return;
          }
          this.template = { ...template, fields: template.fields || [] };

          if (this.template.fields.find(f => f.name == 'email') == null) {
            this.emailField = { name: 'email', label: 'Email', type: 'email', required: true };
            this.template.fields = [...this.template.fields, this.emailField]
          }
          this.initFormValues();
          this.initPortfolioProjects();
        },
        error: () => {
          this.router.navigate(['/templates', this.categoryId]);
        }
      });
  }

  private initFormValues(): void {
    if (!this.template) return;
    for (const field of this.template.fields) {
      this.formValues[field.name] = field.defaultValue ?? '';
    }
  }

  private initPortfolioProjects(): void {
    if (this.categoryId !== 'portfolio') return;
    this.portfolioProjects = [{ title: '', description: '', imageUrl: '' }];
    this.syncPortfolioProjectsJson();
  }

  syncPortfolioProjectsJson(): void {
    this.formValues['projects'] = JSON.stringify(this.portfolioProjects);
  }

  addPortfolioProject(): void {
    this.portfolioProjects.push({ title: '', description: '', imageUrl: '' });
    this.syncPortfolioProjectsJson();
  }

  removePortfolioProject(index: number): void {
    if (this.portfolioProjects.length <= 1) return;
    this.portfolioProjects.splice(index, 1);
    this.syncPortfolioProjectsJson();
  }

  get isPortfolioCategory(): boolean {
    return this.categoryId === 'portfolio';
  }

  get requiredFields() {
    return this.template?.fields?.filter(f => f.required) || [];
  }

  get optionalFields() {
    return this.template?.fields?.filter(f => !f.required) || [];
  }

  get isFormValid(): boolean {
    if (!this.template) return false;
    return this.requiredFields.every(f => !!this.formValues[f.name]?.trim());
  }

  togglePreview(): void {
    if (!this.template) return;
    if (!this.showPreview) {
      if (this.isPortfolioCategory) this.syncPortfolioProjectsJson();
      const rendered = this.templateService.renderTemplate(this.template, this.formValues);
      this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(rendered);
    }
    this.showPreview = !this.showPreview;
  }

  openFullPreview(): void {
    if (!this.template) return;
    if (this.isPortfolioCategory) this.syncPortfolioProjectsJson();
    const rendered = this.templateService.renderTemplate(this.template, this.formValues);
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(rendered);
      newWindow.document.close();
    }
  }

  deploy(): void {
    if (!this.template || !this.isFormValid) return;
    if (this.isPortfolioCategory) this.syncPortfolioProjectsJson();
    this.deploying = true;
    this.deployError = '';
    this.deploySuccess = false;

    this.apiService.deploy({
      templateId: this.templateId,
      categoryId: this.categoryId,
      fields: this.formValues
    }).subscribe({
      next: () => {
        this.deploying = false;
        this.deploySuccess = true;
      },
      error: (err) => {
        this.deploying = false;
        this.deployError = err?.error?.message || 'Deployment failed. Please check your backend is running.';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/templates', this.categoryId]);
  }
}
