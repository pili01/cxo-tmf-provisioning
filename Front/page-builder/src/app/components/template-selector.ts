import { Component, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { TemplateService } from '../services/template';
import { PageTemplate, TemplateCategory } from '../models/template.model';

@Component({
  selector: 'app-template-selector',
  templateUrl: './template-selector.html',
  styleUrl: './template-selector.scss'
})
export class TemplateSelector implements OnInit {
  categoryId = '';
  category?: TemplateCategory;
  templates: PageTemplate[] = [];
  /** Signal so the view always updates (works with zoneless + zone). */
  readonly loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private templateService: TemplateService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.categoryId = this.route.snapshot.params['categoryId'];
    this.category = this.templateService.getCategoryById(this.categoryId);

    if (!this.category) {
      this.loading.set(false);
      this.router.navigate(['/']);
      return;
    }

    this.templateService
      .getTemplatesByCategory(this.categoryId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (templates) => {
          this.templates = (templates || []).map((t) => ({
            ...t,
            fields: t.fields || []
          }));
        },
        error: () => {
          this.templates = [];
        }
      });
  }

  /** Portfolio, advertisement, and product categories use a live iframe instead of a stock card image. */
  get useLivePreview(): boolean {
    return (
      this.categoryId === 'portfolio' ||
      this.categoryId === 'advertisement' ||
      this.categoryId === 'product'
    );
  }

  /** Scaled iframe preview with sample field values for the selected template. */
  livePreviewHtml(template: PageTemplate): SafeHtml {
    const sample = this.templateService.getPickerPreviewFields(this.categoryId, template.id);
    const html = this.templateService.renderTemplate(template, sample);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  selectTemplate(templateId: string): void {
    this.router.navigate(['/build', this.categoryId, templateId]);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
