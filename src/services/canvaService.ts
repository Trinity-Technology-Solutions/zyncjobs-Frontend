interface CanvaTemplate {
  id: string;
  name: string;
  thumbnail: string;
  category: string;
  description: string;
  preview_url: string;
}

class CanvaService {
  private apiKey = import.meta.env.VITE_CANVA_API_KEY || '';
  private baseUrl = 'https://api.canva.com/rest/v1';

  async getResumeTemplates(): Promise<CanvaTemplate[]> {
    try {
      const response = await fetch(`${this.baseUrl}/autofills`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Canva API request failed');
      }

      const data = await response.json();
      return this.mapCanvaTemplates(data.items || []);
    } catch (error) {
      console.error('Canva API Error:', error);
      return this.getFallbackTemplates();
    }
  }

  async searchTemplates(query: string = 'resume'): Promise<CanvaTemplate[]> {
    try {
      const response = await fetch(`${this.baseUrl}/designs/search?query=${encodeURIComponent(query)}&type=template`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Canva search failed');
      }

      const data = await response.json();
      return this.mapCanvaTemplates(data.designs || []);
    } catch (error) {
      console.error('Canva Search Error:', error);
      return this.getFallbackTemplates();
    }
  }

  private mapCanvaTemplates(canvaData: any[]): CanvaTemplate[] {
    return canvaData.map((item, index) => ({
      id: item.id || `template-${index}`,
      name: item.title || `Resume Template ${index + 1}`,
      thumbnail: item.thumbnail?.url || this.generatePlaceholderImage(index),
      category: this.categorizeTemplate(item.title || ''),
      description: item.description || 'Professional resume template',
      preview_url: item.urls?.view_url || ''
    }));
  }

  private categorizeTemplate(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('simple') || lowerTitle.includes('clean')) return 'simple';
    if (lowerTitle.includes('modern') || lowerTitle.includes('creative')) return 'modern';
    if (lowerTitle.includes('photo') || lowerTitle.includes('picture')) return 'withphoto';
    if (lowerTitle.includes('professional') || lowerTitle.includes('corporate')) return 'professional';
    if (lowerTitle.includes('ats') || lowerTitle.includes('minimal')) return 'ats';
    return 'onecolumn';
  }

  private generatePlaceholderImage(index: number): string {
    const colors = ['blue', 'green', 'purple', 'orange', 'teal', 'red'];
    const color = colors[index % colors.length];
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="400" fill="#f8f9fa"/>
        <rect width="300" height="60" fill="${this.getColorHex(color)}"/>
        <text x="150" y="35" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">RESUME TEMPLATE</text>
        <rect x="20" y="80" width="260" height="8" fill="#e9ecef" rx="4"/>
        <rect x="20" y="100" width="200" height="8" fill="#e9ecef" rx="4"/>
        <rect x="20" y="130" width="100" height="6" fill="${this.getColorHex(color)}" rx="3"/>
        <rect x="20" y="150" width="260" height="6" fill="#e9ecef" rx="3"/>
        <rect x="20" y="170" width="220" height="6" fill="#e9ecef" rx="3"/>
        <rect x="20" y="200" width="100" height="6" fill="${this.getColorHex(color)}" rx="3"/>
        <rect x="20" y="220" width="180" height="6" fill="#e9ecef" rx="3"/>
        <rect x="20" y="240" width="160" height="6" fill="#e9ecef" rx="3"/>
      </svg>
    `)}`;
  }

  private getColorHex(color: string): string {
    const colorMap: { [key: string]: string } = {
      blue: '#3b82f6',
      green: '#10b981',
      purple: '#8b5cf6',
      orange: '#f59e0b',
      teal: '#14b8a6',
      red: '#ef4444'
    };
    return colorMap[color] || '#3b82f6';
  }

  private getFallbackTemplates(): CanvaTemplate[] {
    return [];
  }
}

export const canvaService = new CanvaService();
export type { CanvaTemplate };