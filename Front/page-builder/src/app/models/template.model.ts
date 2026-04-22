export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
}

export interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'email' | 'color';
  required: boolean;
  /** API may send null */
  placeholder?: string | null;
  /** API may send null */
  defaultValue?: string | null;
}

export interface PageTemplate {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  thumbnail: string;
  fields: TemplateField[];
  htmlTemplate: string;
}

export interface DeployRequest {
  templateId: string;
  categoryId: string;
  fields: Record<string, string>;
}

export interface DeployResponse {
  success: boolean;
  url?: string;
  message: string;
}

/** One row in the portfolio “Projects” list (stored as JSON in `projects`). */
export interface PortfolioProjectItem {
  title: string;
  description: string;
  imageUrl: string;
}
