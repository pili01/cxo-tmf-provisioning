import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timeout } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../models/environment';
import {
  PageTemplate,
  TemplateCategory,
  TemplateField,
  PortfolioProjectItem
} from '../models/template.model';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private baseUrl = environment.apiUrl;

  private categories: TemplateCategory[] = [
    {
      id: 'advertisement',
      name: 'Advertisement Page',
      description: 'Eye-catching landing pages for your marketing campaigns with bold CTAs and conversion-focused layouts.',
      icon: 'M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 'portfolio',
      name: 'Portfolio Page',
      description: 'Showcase your work beautifully with elegant galleries, project descriptions and professional bios.',
      icon: 'M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      id: 'product',
      name: 'Product Showcase',
      description: 'Feature your products with stunning visuals, feature highlights and compelling pricing sections.',
      icon: 'M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ];

  constructor(private http: HttpClient) {}

  getCategories(): TemplateCategory[] {
    return this.categories;
  }

  getCategoryById(id: string): TemplateCategory | undefined {
    return this.categories.find(c => c.id === id);
  }

  getTemplatesByCategory(categoryId: string): Observable<PageTemplate[]> {
    return this.http.get<PageTemplate[]>(
      `${this.baseUrl}/templates/${categoryId}`
    ).pipe(
      timeout(30000),
      map((list) => (list ?? []).map((t) => this.normalizeTemplate(t))),
      catchError(() => of(this.getFallbackTemplates(categoryId)))
    );
  }

  getTemplateById(categoryId: string, templateId: string): Observable<PageTemplate | undefined> {
    return this.http.get<PageTemplate>(
      `${this.baseUrl}/templates/${categoryId}/${templateId}`
    ).pipe(
      timeout(30000),
      map((t) => (t ? this.normalizeTemplate(t) : undefined)),
      catchError(() => {
        const templates = this.getFallbackTemplates(categoryId);
        return of(templates.find((x) => x.id === templateId));
      })
    );
  }

  /** Maps .NET JSON (nullable strings, full htmlTemplate) to safe PageTemplate for the UI */
  private normalizeTemplate(t: PageTemplate): PageTemplate {
    return {
      ...t,
      htmlTemplate: t.htmlTemplate ?? '',
      fields: (t.fields ?? []).map((f) => this.normalizeField(f))
    };
  }

  private normalizeField(f: TemplateField): TemplateField {
    const type = this.normalizeFieldType(f.type ?? 'text');
    return {
      ...f,
      type,
      placeholder: f.placeholder ?? undefined,
      defaultValue: f.defaultValue ?? undefined
    };
  }

  private normalizeFieldType(type: string): TemplateField['type'] {
    const allowed: TemplateField['type'][] = ['text', 'textarea', 'url', 'email', 'color'];
    return allowed.includes(type as TemplateField['type'])
      ? (type as TemplateField['type'])
      : 'text';
  }

  renderTemplate(template: PageTemplate, values: Record<string, string>): string {
    const merged: Record<string, string> = { ...values };
    if (template.categoryId === 'portfolio') {
      const variant = template.id === 'portfolio-developer' ? 'developer' : 'creative';
      merged['projectsBlock'] = this.buildProjectsBlockHtml(merged['projects'], variant);
    } else {
      merged['projectsBlock'] = '';
    }

    let html = template.htmlTemplate;
    for (const [key, value] of Object.entries(merged)) {
      if (key === 'projects') continue;
      const regex = new RegExp(`{{${this.escapeRegExp(key)}}}`, 'g');
      html = html.replace(regex, value ?? '');
    }
    html = html.replace(/{{[^}]+}}/g, '');
    return html;
  }

  /**
   * Sample field values for the template picker iframe (all categories that use live preview).
   */
  getPickerPreviewFields(categoryId: string, templateId: string): Record<string, string> {
    switch (categoryId) {
      case 'portfolio':
        return this.getPortfolioPreviewFields(templateId);
      case 'advertisement':
        return this.getAdvertisementPreviewFields(templateId);
      case 'product':
        return this.getProductPreviewFields(templateId);
      default:
        return {};
    }
  }

  /** Sample field values so the template picker can show a real-looking iframe preview (portfolio). */
  getPortfolioPreviewFields(templateId: string): Record<string, string> {
    const sampleProjects: PortfolioProjectItem[] = [
      {
        title: 'Acme Rebrand',
        description: 'Visual identity, design system, and marketing site.',
        imageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=340&fit=crop'
      },
      {
        title: 'Mobile Banking',
        description: 'End-to-end product design for a fintech client.',
        imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=340&fit=crop'
      }
    ];
    const projects = JSON.stringify(sampleProjects);

    if (templateId === 'portfolio-creative') {
      return {
        name: 'Alex Morgan',
        title: 'Creative Designer & Art Director',
        bio: 'I craft thoughtful brand and digital experiences. This is a sample preview — your content will replace this.',
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        email: 'hello@example.com',
        accentColor: '#f5576c',
        projects
      };
    }

    return {
      name: 'Jordan Lee',
      title: 'Full Stack Developer',
      bio: 'Building reliable APIs and polished UIs. Preview sample — customize everything in the form.',
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
      skill1: 'Angular',
      skill2: '.NET',
      skill3: 'TypeScript',
      skill4: 'Azure',
      githubUrl: 'https://github.com',
      linkedinUrl: 'https://linkedin.com',
      email: 'jordan@example.com',
      projects
    };
  }

  /** Sample data for advertisement templates in the picker iframe. */
  getAdvertisementPreviewFields(templateId: string): Record<string, string> {
    if (templateId === 'ad-minimal') {
      return {
        headline: 'Simple. Elegant. Powerful.',
        description:
          'Sample preview — replace with your offer. Clean layout focused on clarity and one clear action.',
        ctaText: 'Learn More',
        ctaUrl: 'https://example.com',
        logoUrl:
          'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=64&fit=crop',
        bgColor: '#0f0f23',
        accentColor: '#00d4ff'
      };
    }
    return {
      headline: 'Launch Faster',
      subheadline: 'Reach your audience with a page that converts.',
      description:
        'Sample preview text. Highlight benefits, build trust, and drive clicks with a bold hero and feature row.',
      ctaText: 'Get Started',
      ctaUrl: 'https://example.com',
      heroImage:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=640&fit=crop',
      brandColor: '#667eea',
      feature1: 'Lightning fast',
      feature2: 'Secure by design',
      feature3: 'Built for teams'
    };
  }

  /** Sample data for product templates in the picker iframe. */
  getProductPreviewFields(templateId: string): Record<string, string> {
    if (templateId === 'product-physical') {
      return {
        productName: 'Aura One',
        tagline: 'Sound without limits',
        description:
          'Sample preview — describe your product here. Use the form to set price, specs, and imagery.',
        productImage:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
        price: '$299',
        spec1: '40h battery',
        spec2: 'Active noise cancelling',
        spec3: 'Hi-Res certified',
        buyUrl: 'https://example.com',
        accentColor: '#00f2fe'
      };
    }
    return {
      productName: 'CloudSync Pro',
      tagline: 'Sync everything, everywhere',
      description:
        'Sample preview — your real copy goes here. Show value, features, and pricing in one scroll.',
      heroImage:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=700&fit=crop',
      feature1Title: 'Real-time sync',
      feature1Desc: 'Changes propagate instantly across devices.',
      feature2Title: 'Encryption',
      feature2Desc: 'Data protected at rest and in transit.',
      feature3Title: 'Teams',
      feature3Desc: 'Collaborate with granular access.',
      price: '$9.99/mo',
      ctaText: 'Start Free Trial',
      ctaUrl: 'https://example.com',
      primaryColor: '#4facfe'
    };
  }

  private escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private buildProjectsBlockHtml(projectsJson: string | undefined, variant: 'creative' | 'developer'): string {
    let items: PortfolioProjectItem[] = [];
    try {
      const parsed = projectsJson ? JSON.parse(projectsJson) : [];
      items = Array.isArray(parsed) ? parsed : [];
    } catch {
      items = [];
    }

    const esc = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    if (items.length === 0) {
      return `<p class="portfolio-empty">${esc('Add projects using the + button in the builder.')}</p>`;
    }

    return items
      .map((p) => {
        const title = esc((p.title ?? '').trim() || 'Untitled');
        const desc = esc((p.description ?? '').trim());
        const url = (p.imageUrl ?? '').trim();
        if (variant === 'developer') {
          const img = url
            ? `<img src="${esc(url)}" alt="${title}" loading="lazy" onerror="this.style.display='none'">`
            : `<div class="dev-project-img-fallback"></div>`;
          return `<div class="dev-project-card">${img}<div class="box"><h3>${title}</h3><p>${desc}</p></div></div>`;
        }
        const img = url
          ? `<img src="${esc(url)}" alt="${title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=220&fit=crop'">`
          : `<div class="project-img-placeholder"></div>`;
        return `<div class="project-card">${img}<div class="content"><h3>${title}</h3><p>${desc}</p></div></div>`;
      })
      .join('');
  }

  private getFallbackTemplates(categoryId: string): PageTemplate[] {
    const templates: Record<string, PageTemplate[]> = {
      advertisement: [
        {
          id: 'ad-bold',
          categoryId: 'advertisement',
          name: 'Bold Launch',
          description: 'High-impact landing page with bold typography and strong call-to-action',
          thumbnail: '',
          fields: [
            { name: 'headline', label: 'Headline', type: 'text', required: true, placeholder: 'Your Amazing Product' },
            { name: 'subheadline', label: 'Subheadline', type: 'text', required: true, placeholder: 'The future of innovation starts here' },
            { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe your product or service...' },
            { name: 'ctaText', label: 'Button Text', type: 'text', required: true, placeholder: 'Get Started Now', defaultValue: 'Get Started Now' },
            { name: 'ctaUrl', label: 'Button Link', type: 'url', required: true, placeholder: 'https://your-link.com' },
            { name: 'heroImage', label: 'Hero Image URL', type: 'url', required: false, placeholder: 'https://example.com/hero.jpg' },
            { name: 'brandColor', label: 'Brand Color', type: 'color', required: false, defaultValue: '#667eea' },
            { name: 'feature1', label: 'Feature 1', type: 'text', required: false, placeholder: 'Lightning Fast' },
            { name: 'feature2', label: 'Feature 2', type: 'text', required: false, placeholder: 'Secure & Reliable' },
            { name: 'feature3', label: 'Feature 3', type: 'text', required: false, placeholder: '24/7 Support' }
          ],
          htmlTemplate: AD_BOLD_TEMPLATE
        },
        {
          id: 'ad-minimal',
          categoryId: 'advertisement',
          name: 'Minimal Promo',
          description: 'Clean, minimal design focusing on clarity and elegance',
          thumbnail: '',
          fields: [
            { name: 'headline', label: 'Headline', type: 'text', required: true, placeholder: 'Simple. Elegant. Powerful.' },
            { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'A brief description of what you offer...' },
            { name: 'ctaText', label: 'Button Text', type: 'text', required: true, placeholder: 'Learn More', defaultValue: 'Learn More' },
            { name: 'ctaUrl', label: 'Button Link', type: 'url', required: true, placeholder: 'https://your-link.com' },
            { name: 'logoUrl', label: 'Logo URL', type: 'url', required: false, placeholder: 'https://example.com/logo.png' },
            { name: 'bgColor', label: 'Background Color', type: 'color', required: false, defaultValue: '#0f0f23' },
            { name: 'accentColor', label: 'Accent Color', type: 'color', required: false, defaultValue: '#00d4ff' }
          ],
          htmlTemplate: AD_MINIMAL_TEMPLATE
        }
      ],
      portfolio: [
        {
          id: 'portfolio-creative',
          categoryId: 'portfolio',
          name: 'Creative Portfolio',
          description: 'Artistic portfolio layout with elegant project showcasing',
          thumbnail: '',
          fields: [
            { name: 'name', label: 'Your Name', type: 'text', required: true, placeholder: 'Jane Doe' },
            { name: 'title', label: 'Professional Title', type: 'text', required: true, placeholder: 'Creative Designer & Developer' },
            { name: 'bio', label: 'Bio', type: 'textarea', required: true, placeholder: 'Tell your story...' },
            { name: 'profileImage', label: 'Profile Image URL', type: 'url', required: false, placeholder: 'https://example.com/photo.jpg' },
            { name: 'email', label: 'Contact Email', type: 'email', required: false, placeholder: 'jane@example.com' },
            { name: 'accentColor', label: 'Accent Color', type: 'color', required: false, defaultValue: '#f5576c' }
          ],
          htmlTemplate: PORTFOLIO_CREATIVE_TEMPLATE
        },
        {
          id: 'portfolio-developer',
          categoryId: 'portfolio',
          name: 'Developer Portfolio',
          description: 'Tech-focused portfolio with dark theme and code aesthetics',
          thumbnail: '',
          fields: [
            { name: 'name', label: 'Your Name', type: 'text', required: true, placeholder: 'John Smith' },
            { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Full Stack Developer' },
            { name: 'bio', label: 'About', type: 'textarea', required: true, placeholder: 'Passionate developer building...' },
            { name: 'profileImage', label: 'Profile Image URL', type: 'url', required: false, placeholder: 'https://example.com/photo.jpg' },
            { name: 'skill1', label: 'Skill 1', type: 'text', required: false, placeholder: 'Angular', defaultValue: 'Angular' },
            { name: 'skill2', label: 'Skill 2', type: 'text', required: false, placeholder: '.NET', defaultValue: '.NET' },
            { name: 'skill3', label: 'Skill 3', type: 'text', required: false, placeholder: 'Docker', defaultValue: 'Docker' },
            { name: 'skill4', label: 'Skill 4', type: 'text', required: false, placeholder: 'Azure', defaultValue: 'Azure' },
            { name: 'githubUrl', label: 'GitHub URL', type: 'url', required: false, placeholder: 'https://github.com/username' },
            { name: 'linkedinUrl', label: 'LinkedIn URL', type: 'url', required: false, placeholder: 'https://linkedin.com/in/username' },
            { name: 'email', label: 'Email', type: 'email', required: false, placeholder: 'john@example.com' }
          ],
          htmlTemplate: PORTFOLIO_DEV_TEMPLATE
        }
      ],
      product: [
        {
          id: 'product-saas',
          categoryId: 'product',
          name: 'SaaS Showcase',
          description: 'Modern SaaS product page with features and pricing highlights',
          thumbnail: '',
          fields: [
            { name: 'productName', label: 'Product Name', type: 'text', required: true, placeholder: 'CloudSync Pro' },
            { name: 'tagline', label: 'Tagline', type: 'text', required: true, placeholder: 'Sync everything, everywhere' },
            { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe your product...' },
            { name: 'heroImage', label: 'Product Image URL', type: 'url', required: false, placeholder: 'https://example.com/product.png' },
            { name: 'feature1Title', label: 'Feature 1 Title', type: 'text', required: false, placeholder: 'Real-time Sync' },
            { name: 'feature1Desc', label: 'Feature 1 Description', type: 'text', required: false, placeholder: 'Keep all your devices in perfect harmony' },
            { name: 'feature2Title', label: 'Feature 2 Title', type: 'text', required: false, placeholder: 'End-to-End Encryption' },
            { name: 'feature2Desc', label: 'Feature 2 Description', type: 'text', required: false, placeholder: 'Your data is always protected' },
            { name: 'feature3Title', label: 'Feature 3 Title', type: 'text', required: false, placeholder: 'Team Collaboration' },
            { name: 'feature3Desc', label: 'Feature 3 Description', type: 'text', required: false, placeholder: 'Work together seamlessly' },
            { name: 'price', label: 'Price', type: 'text', required: false, placeholder: '$9.99/mo', defaultValue: '$9.99/mo' },
            { name: 'ctaText', label: 'CTA Button Text', type: 'text', required: true, placeholder: 'Start Free Trial', defaultValue: 'Start Free Trial' },
            { name: 'ctaUrl', label: 'CTA Link', type: 'url', required: true, placeholder: 'https://your-app.com/signup' },
            { name: 'primaryColor', label: 'Primary Color', type: 'color', required: false, defaultValue: '#4facfe' }
          ],
          htmlTemplate: PRODUCT_SAAS_TEMPLATE
        },
        {
          id: 'product-physical',
          categoryId: 'product',
          name: 'Product Launch',
          description: 'Stunning product launch page for physical or digital products',
          thumbnail: '',
          fields: [
            { name: 'productName', label: 'Product Name', type: 'text', required: true, placeholder: 'Premium Headphones' },
            { name: 'tagline', label: 'Tagline', type: 'text', required: true, placeholder: 'Sound Redefined' },
            { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe your product...' },
            { name: 'productImage', label: 'Product Image URL', type: 'url', required: false, placeholder: 'https://example.com/product.png' },
            { name: 'price', label: 'Price', type: 'text', required: false, placeholder: '$299', defaultValue: '$299' },
            { name: 'spec1', label: 'Spec 1', type: 'text', required: false, placeholder: '40h Battery Life' },
            { name: 'spec2', label: 'Spec 2', type: 'text', required: false, placeholder: 'Active Noise Cancelling' },
            { name: 'spec3', label: 'Spec 3', type: 'text', required: false, placeholder: 'Hi-Res Audio Certified' },
            { name: 'buyUrl', label: 'Buy Link', type: 'url', required: true, placeholder: 'https://store.example.com' },
            { name: 'accentColor', label: 'Accent Color', type: 'color', required: false, defaultValue: '#00f2fe' }
          ],
          htmlTemplate: PRODUCT_PHYSICAL_TEMPLATE
        }
      ]
    };
    return templates[categoryId] || [];
  }
}

const AD_BOLD_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{headline}}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #1a1a2e; background: #fff; }
  .hero {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, {{brandColor}} 0%, #764ba2 100%);
    position: relative; overflow: hidden; padding: 2rem;
  }
  .hero::before {
    content: ''; position: absolute; width: 200%; height: 200%; top: -50%; left: -50%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
    animation: pulse 4s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
  .hero-content { position: relative; text-align: center; max-width: 800px; color: #fff; }
  .hero h1 { font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 800; margin-bottom: 1rem; line-height: 1.1; }
  .hero h2 { font-size: clamp(1.1rem, 2.5vw, 1.5rem); font-weight: 400; opacity: 0.9; margin-bottom: 2rem; }
  .hero p { font-size: 1.1rem; opacity: 0.85; max-width: 600px; margin: 0 auto 2.5rem; line-height: 1.7; }
  .hero-image { max-width: 100%; border-radius: 16px; margin-bottom: 2rem; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
  .cta-btn {
    display: inline-block; padding: 1rem 3rem; background: #fff; color: {{brandColor}};
    font-size: 1.1rem; font-weight: 700; border-radius: 50px; text-decoration: none;
    transition: transform 0.3s, box-shadow 0.3s;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  }
  .cta-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
  .features {
    display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap;
    padding: 5rem 2rem; max-width: 1000px; margin: 0 auto;
  }
  .feature {
    flex: 1; min-width: 200px; text-align: center; padding: 2rem;
    border-radius: 16px; background: #f8f9ff;
    transition: transform 0.3s; border: 1px solid #eee;
  }
  .feature:hover { transform: translateY(-5px); }
  .feature-icon {
    width: 60px; height: 60px; border-radius: 50%;
    background: linear-gradient(135deg, {{brandColor}}, #764ba2);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1rem; color: #fff; font-size: 1.5rem;
  }
  .feature h3 { font-size: 1.15rem; margin-bottom: 0.5rem; }
</style>
</head>
<body>
  <section class="hero">
    <div class="hero-content">
      <img class="hero-image" src="{{heroImage}}" alt="" onerror="this.style.display='none'">
      <h1>{{headline}}</h1>
      <h2>{{subheadline}}</h2>
      <p>{{description}}</p>
      <a href="{{ctaUrl}}" class="cta-btn">{{ctaText}}</a>
    </div>
  </section>
  <section class="features">
    <div class="feature">
      <div class="feature-icon">&#9889;</div>
      <h3>{{feature1}}</h3>
    </div>
    <div class="feature">
      <div class="feature-icon">&#128274;</div>
      <h3>{{feature2}}</h3>
    </div>
    <div class="feature">
      <div class="feature-icon">&#128640;</div>
      <h3>{{feature3}}</h3>
    </div>
  </section>
</body>
</html>`;

const AD_MINIMAL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{headline}}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;500;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: {{bgColor}}; color: #fff; min-height: 100vh; }
  .container {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; padding: 3rem 2rem; text-align: center;
  }
  .logo { max-height: 60px; margin-bottom: 3rem; filter: brightness(0) invert(1); }
  h1 {
    font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 700; margin-bottom: 1.5rem;
    background: linear-gradient(90deg, #fff, {{accentColor}});
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  p { font-size: 1.2rem; max-width: 550px; opacity: 0.7; line-height: 1.8; margin-bottom: 3rem; font-weight: 300; }
  .cta {
    display: inline-block; padding: 1rem 3rem;
    border: 2px solid {{accentColor}}; color: {{accentColor}};
    font-size: 1rem; font-weight: 500; border-radius: 50px; text-decoration: none;
    transition: all 0.3s;
  }
  .cta:hover { background: {{accentColor}}; color: {{bgColor}}; }
  .line {
    width: 60px; height: 2px; background: {{accentColor}}; margin: 3rem auto 0; opacity: 0.5;
  }
</style>
</head>
<body>
  <div class="container">
    <img class="logo" src="{{logoUrl}}" alt="" onerror="this.style.display='none'">
    <h1>{{headline}}</h1>
    <p>{{description}}</p>
    <a href="{{ctaUrl}}" class="cta">{{ctaText}}</a>
    <div class="line"></div>
  </div>
</body>
</html>`;

const PORTFOLIO_CREATIVE_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{name}} - Portfolio</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #2d2d2d; background: #fafafa; }
  .hero {
    min-height: 100vh; display: flex; align-items: center;
    padding: 4rem 2rem; max-width: 1200px; margin: 0 auto; gap: 4rem; flex-wrap: wrap;
  }
  .hero-text { flex: 1; min-width: 300px; }
  .hero-text h1 {
    font-family: 'Playfair Display', serif; font-size: clamp(3rem, 5vw, 5rem);
    line-height: 1.1; margin-bottom: 0.5rem;
  }
  .hero-text .title {
    font-size: 1.2rem; color: {{accentColor}}; font-weight: 600; margin-bottom: 1.5rem;
  }
  .hero-text .bio { font-size: 1.1rem; line-height: 1.8; opacity: 0.75; max-width: 500px; }
  .hero-image {
    flex: 1; min-width: 280px; display: flex; justify-content: center;
  }
  .hero-image img {
    width: 350px; height: 350px; object-fit: cover; border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.12);
  }
  .projects {
    padding: 5rem 2rem; max-width: 1200px; margin: 0 auto;
  }
  .projects h2 {
    font-family: 'Playfair Display', serif; font-size: 2.5rem;
    margin-bottom: 3rem; text-align: center;
  }
  .project-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2.5rem; }
  .project-card {
    border-radius: 16px; overflow: hidden; background: #fff;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06); transition: transform 0.3s;
  }
  .project-card:hover { transform: translateY(-8px); }
  .project-card img { width: 100%; height: 220px; object-fit: cover; }
  .project-card .content { padding: 1.5rem; }
  .project-card h3 { font-size: 1.3rem; margin-bottom: 0.5rem; }
  .project-card p { opacity: 0.65; line-height: 1.6; }
  .project-img-placeholder { width: 100%; height: 220px; background: linear-gradient(135deg, #ececec, #ddd); }
  .portfolio-empty { text-align: center; color: #888; padding: 2rem; grid-column: 1 / -1; }
  .contact {
    text-align: center; padding: 5rem 2rem; background: #fff;
  }
  .contact h2 { font-family: 'Playfair Display', serif; font-size: 2rem; margin-bottom: 1rem; }
  .contact a {
    color: {{accentColor}}; text-decoration: none; font-size: 1.2rem; font-weight: 600;
  }
</style>
</head>
<body>
  <section class="hero">
    <div class="hero-text">
      <h1>{{name}}</h1>
      <div class="title">{{title}}</div>
      <p class="bio">{{bio}}</p>
    </div>
    <div class="hero-image">
      <img src="{{profileImage}}" alt="{{name}}" onerror="this.style.display='none'">
    </div>
  </section>
  <section class="projects">
    <h2>Selected Work</h2>
    <div class="project-grid">{{projectsBlock}}</div>
  </section>
  <section class="contact">
    <h2>Let's Work Together</h2>
    <a href="mailto:{{email}}">{{email}}</a>
  </section>
</body>
</html>`;

const PORTFOLIO_DEV_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{name}} - Developer</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #0a0a1a; color: #e0e0e0; }
  .header {
    min-height: auto; display: flex; align-items: flex-start; justify-content: center;
    text-align: center; padding: 3rem 2rem 4rem; position: relative;
  }
  .header::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%);
  }
  .header-content { position: relative; max-width: 900px; width: 100%; }
  .avatar {
    width: 120px; height: 120px; border-radius: 50%; object-fit: cover;
    border: 3px solid #6366f1; margin-bottom: 1.5rem;
  }
  .header h1 {
    font-size: clamp(2rem, 4vw, 3.5rem); font-weight: 700; margin-bottom: 0.5rem;
    background: linear-gradient(90deg, #6366f1, #a78bfa);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .header .subtitle {
    font-family: 'JetBrains Mono', monospace; color: #6366f1; margin-bottom: 1.5rem;
  }
  .header .bio { opacity: 0.7; line-height: 1.8; max-width: 550px; margin: 0 auto 2rem; }
  .skills {
    display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; margin-bottom: 2rem;
  }
  .skill {
    padding: 0.5rem 1.25rem; background: rgba(99,102,241,0.15);
    border: 1px solid rgba(99,102,241,0.3); border-radius: 50px;
    font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: #a78bfa;
  }
  .links { display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap; margin-bottom: 2.5rem; }
  .links a {
    color: #6366f1; text-decoration: none; font-weight: 600;
    transition: color 0.3s; padding: 0.5rem 1.5rem;
    border: 1px solid #6366f1; border-radius: 50px;
  }
  .links a:hover { background: #6366f1; color: #fff; }
  .dev-projects-wrap { text-align: left; margin-top: 0.5rem; }
  .dev-projects-wrap > h2 {
    font-family: 'JetBrains Mono', monospace; font-size: 1rem; color: #a78bfa;
    margin-bottom: 1.25rem; text-align: center;
  }
  .dev-project-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem;
  }
  .dev-project-card {
    background: #111127; border: 1px solid rgba(99,102,241,0.25); border-radius: 12px;
    overflow: hidden; text-align: left;
  }
  .dev-project-card img { width: 100%; height: 140px; object-fit: cover; display: block; }
  .dev-project-img-fallback { height: 140px; background: linear-gradient(135deg, #1a1a35, #0d0d1a); }
  .dev-project-card .box { padding: 1rem 1.1rem; }
  .dev-project-card h3 { font-size: 1rem; margin-bottom: 0.35rem; color: #fff; }
  .dev-project-card p { font-size: 0.85rem; opacity: 0.75; line-height: 1.5; }
  .portfolio-empty { color: #888; padding: 1rem 0; text-align: center; grid-column: 1 / -1; }
</style>
</head>
<body>
  <section class="header">
    <div class="header-content">
      <img class="avatar" src="{{profileImage}}" alt="{{name}}" onerror="this.style.display='none'">
      <h1>{{name}}</h1>
      <p class="subtitle">{{title}}</p>
      <p class="bio">{{bio}}</p>
      <div class="skills">
        <span class="skill">{{skill1}}</span>
        <span class="skill">{{skill2}}</span>
        <span class="skill">{{skill3}}</span>
        <span class="skill">{{skill4}}</span>
      </div>
      <div class="links">
        <a href="{{githubUrl}}">GitHub</a>
        <a href="{{linkedinUrl}}">LinkedIn</a>
        <a href="mailto:{{email}}">Email</a>
      </div>
      <div class="dev-projects-wrap">
        <h2>Projects</h2>
        <div class="dev-project-grid">{{projectsBlock}}</div>
      </div>
    </div>
  </section>
</body>
</html>`;

const PRODUCT_SAAS_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{productName}}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #1a1a2e; background: #fff; }
  nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.5rem 3rem; position: fixed; top: 0; width: 100%;
    background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); z-index: 100;
    border-bottom: 1px solid #eee;
  }
  nav .brand { font-weight: 800; font-size: 1.3rem; color: {{primaryColor}}; }
  nav .nav-cta {
    padding: 0.6rem 1.5rem; background: {{primaryColor}}; color: #fff;
    border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 0.9rem;
  }
  .hero {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; text-align: center;
    padding: 8rem 2rem 4rem; background: linear-gradient(180deg, #f0f4ff 0%, #fff 100%);
  }
  .hero .badge {
    display: inline-block; padding: 0.4rem 1rem; background: rgba(79,172,254,0.1);
    color: {{primaryColor}}; border-radius: 50px; font-size: 0.85rem;
    font-weight: 600; margin-bottom: 1.5rem;
  }
  .hero h1 { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 800; margin-bottom: 1rem; line-height: 1.15; }
  .hero .tagline { font-size: 1.25rem; opacity: 0.6; margin-bottom: 2.5rem; max-width: 500px; }
  .hero .cta {
    display: inline-block; padding: 1rem 2.5rem; background: {{primaryColor}};
    color: #fff; font-weight: 700; border-radius: 50px; text-decoration: none;
    font-size: 1.1rem; transition: transform 0.3s, box-shadow 0.3s;
    box-shadow: 0 4px 20px rgba(79,172,254,0.3);
  }
  .hero .cta:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(79,172,254,0.4); }
  .hero .price-badge { margin-top: 1rem; font-size: 0.9rem; opacity: 0.5; }
  .hero-img {
    max-width: 800px; width: 100%; margin-top: 3rem; border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.1);
  }
  .features { padding: 6rem 2rem; max-width: 1100px; margin: 0 auto; }
  .features h2 { text-align: center; font-size: 2.2rem; margin-bottom: 3rem; }
  .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
  .feature-item {
    padding: 2rem; border-radius: 16px; background: #f8faff;
    border: 1px solid #eef2ff; transition: transform 0.3s;
  }
  .feature-item:hover { transform: translateY(-4px); }
  .feature-item h3 { font-size: 1.2rem; margin-bottom: 0.75rem; color: {{primaryColor}}; }
  .feature-item p { opacity: 0.65; line-height: 1.7; }
</style>
</head>
<body>
  <nav>
    <div class="brand">{{productName}}</div>
    <a href="{{ctaUrl}}" class="nav-cta">{{ctaText}}</a>
  </nav>
  <section class="hero">
    <span class="badge">Introducing {{productName}}</span>
    <h1>{{tagline}}</h1>
    <p class="tagline">{{description}}</p>
    <a href="{{ctaUrl}}" class="cta">{{ctaText}}</a>
    <p class="price-badge">Starting at {{price}}</p>
    <img class="hero-img" src="{{heroImage}}" alt="{{productName}}" onerror="this.style.display='none'">
  </section>
  <section class="features">
    <h2>Everything You Need</h2>
    <div class="feature-grid">
      <div class="feature-item">
        <h3>{{feature1Title}}</h3>
        <p>{{feature1Desc}}</p>
      </div>
      <div class="feature-item">
        <h3>{{feature2Title}}</h3>
        <p>{{feature2Desc}}</p>
      </div>
      <div class="feature-item">
        <h3>{{feature3Title}}</h3>
        <p>{{feature3Desc}}</p>
      </div>
    </div>
  </section>
</body>
</html>`;

const PRODUCT_PHYSICAL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{productName}} — {{tagline}}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;600;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #000; color: #fff; }
  .hero {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    flex-direction: column; text-align: center; padding: 3rem 2rem;
    background: radial-gradient(ellipse at center, #111 0%, #000 70%);
  }
  .hero h1 {
    font-size: clamp(3rem, 7vw, 6rem); font-weight: 800; letter-spacing: -2px;
    margin-bottom: 0.5rem;
    background: linear-gradient(90deg, #fff, {{accentColor}});
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .hero .tagline {
    font-size: 1.3rem; font-weight: 300; opacity: 0.6; margin-bottom: 3rem;
  }
  .product-img {
    max-width: 500px; width: 100%; margin-bottom: 3rem;
    filter: drop-shadow(0 0 60px rgba(0,242,254,0.2));
    animation: float 3s ease-in-out infinite;
  }
  @keyframes float {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-15px); }
  }
  .price {
    font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem;
    color: {{accentColor}};
  }
  .buy-btn {
    display: inline-block; padding: 1rem 3rem; background: {{accentColor}};
    color: #000; font-weight: 700; font-size: 1.1rem; border-radius: 50px;
    text-decoration: none; margin-top: 1.5rem;
    transition: transform 0.3s, box-shadow 0.3s;
  }
  .buy-btn:hover { transform: scale(1.05); box-shadow: 0 0 30px rgba(0,242,254,0.4); }
  .specs {
    display: flex; gap: 3rem; justify-content: center; flex-wrap: wrap;
    padding: 4rem 2rem; border-top: 1px solid #222;
  }
  .spec {
    text-align: center; min-width: 150px;
  }
  .spec .value { font-size: 1.1rem; font-weight: 600; color: {{accentColor}}; margin-bottom: 0.25rem; }
  .spec .label { font-size: 0.85rem; opacity: 0.4; }
  .description {
    max-width: 600px; margin: 0 auto; text-align: center; padding: 3rem 2rem 5rem;
    font-size: 1.1rem; line-height: 1.8; opacity: 0.6;
  }
</style>
</head>
<body>
  <section class="hero">
    <h1>{{productName}}</h1>
    <p class="tagline">{{tagline}}</p>
    <img class="product-img" src="{{productImage}}" alt="{{productName}}" onerror="this.style.display='none'">
    <div class="price">{{price}}</div>
    <a href="{{buyUrl}}" class="buy-btn">Buy Now</a>
  </section>
  <section class="specs">
    <div class="spec"><div class="value">{{spec1}}</div></div>
    <div class="spec"><div class="value">{{spec2}}</div></div>
    <div class="spec"><div class="value">{{spec3}}</div></div>
  </section>
  <div class="description">{{description}}</div>
</body>
</html>`;
