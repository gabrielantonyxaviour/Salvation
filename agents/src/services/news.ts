/**
 * News Verification Service
 * Uses NewsAPI and GDELT for project news verification
 */

import config from '../config.js';

export interface NewsArticle {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
  relevanceScore?: number;
}

export interface NewsResult {
  found: boolean;
  articles: NewsArticle[];
  totalResults: number;
  relevantMentions: number;
  confidence: number;
  sources: string[];
}

export class NewsService {
  /**
   * Check for news about a project
   */
  async checkProjectNews(
    projectName: string,
    location: string,
    keywords: string[] = []
  ): Promise<NewsResult> {
    console.log(`Searching news for: "${projectName}" in ${location}`);

    const results: NewsArticle[] = [];
    const sources: string[] = [];

    // Try NewsAPI first
    if (config.newsApiKey) {
      try {
        const newsApiResults = await this.searchNewsAPI(projectName, location, keywords);
        results.push(...newsApiResults);
        if (newsApiResults.length > 0) {
          sources.push('NewsAPI');
        }
      } catch (error) {
        console.warn('NewsAPI search failed:', error);
      }
    }

    // Try GDELT (free, no API key needed)
    try {
      const gdeltResults = await this.searchGDELT(projectName, location, keywords);
      results.push(...gdeltResults);
      if (gdeltResults.length > 0) {
        sources.push('GDELT');
      }
    } catch (error) {
      console.warn('GDELT search failed:', error);
    }

    // Calculate relevance scores
    const scoredResults = this.scoreRelevance(results, projectName, location, keywords);

    // Filter to relevant articles only
    const relevantArticles = scoredResults.filter(
      a => (a.relevanceScore || 0) >= config.verification.newsRelevanceThreshold
    );

    // Calculate confidence based on news coverage
    const confidence = this.calculateConfidence(relevantArticles);

    return {
      found: relevantArticles.length > 0,
      articles: relevantArticles.slice(0, 10), // Top 10
      totalResults: results.length,
      relevantMentions: relevantArticles.length,
      confidence,
      sources,
    };
  }

  /**
   * Search NewsAPI
   * Free tier: 100 requests/day
   */
  private async searchNewsAPI(
    projectName: string,
    location: string,
    keywords: string[]
  ): Promise<NewsArticle[]> {
    const query = this.buildSearchQuery(projectName, location, keywords);
    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set('q', query);
    url.searchParams.set('apiKey', config.newsApiKey);
    url.searchParams.set('language', 'en');
    url.searchParams.set('sortBy', 'relevancy');
    url.searchParams.set('pageSize', '20');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json() as any;

    return (data.articles || []).map((article: any) => ({
      title: article.title,
      description: article.description || '',
      source: article.source?.name || 'Unknown',
      url: article.url,
      publishedAt: article.publishedAt,
    }));
  }

  /**
   * Search GDELT (Global Database of Events)
   * Free, no API key required
   */
  private async searchGDELT(
    projectName: string,
    location: string,
    keywords: string[]
  ): Promise<NewsArticle[]> {
    const query = this.buildSearchQuery(projectName, location, keywords);
    const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
    url.searchParams.set('query', query);
    url.searchParams.set('mode', 'artlist');
    url.searchParams.set('format', 'json');
    url.searchParams.set('maxrecords', '20');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`GDELT error: ${response.status}`);
    }

    const data = await response.json() as any;

    return (data.articles || []).map((article: any) => ({
      title: article.title || '',
      description: article.seendate || '',
      source: article.domain || 'GDELT',
      url: article.url,
      publishedAt: article.seendate || '',
    }));
  }

  /**
   * Build search query combining project name, location, and keywords
   */
  private buildSearchQuery(
    projectName: string,
    location: string,
    keywords: string[]
  ): string {
    const parts: string[] = [];

    // Add project name
    if (projectName) {
      parts.push(`"${projectName}"`);
    }

    // Add location
    if (location) {
      parts.push(location);
    }

    // Add keywords
    if (keywords.length > 0) {
      parts.push(keywords.join(' OR '));
    }

    // Add infrastructure-related terms
    const infraTerms = ['infrastructure', 'project', 'development', 'construction'];
    parts.push(infraTerms.join(' OR '));

    return parts.join(' ');
  }

  /**
   * Score relevance of articles
   */
  private scoreRelevance(
    articles: NewsArticle[],
    projectName: string,
    location: string,
    keywords: string[]
  ): NewsArticle[] {
    const projectNameLower = projectName.toLowerCase();
    const locationLower = location.toLowerCase();
    const keywordsLower = keywords.map(k => k.toLowerCase());

    return articles.map(article => {
      let score = 0;
      const textToSearch = `${article.title} ${article.description}`.toLowerCase();

      // Check for project name mention
      if (textToSearch.includes(projectNameLower)) {
        score += 0.4;
      }

      // Check for location mention
      if (textToSearch.includes(locationLower)) {
        score += 0.3;
      }

      // Check for keyword mentions
      const keywordMatches = keywordsLower.filter(k => textToSearch.includes(k));
      score += (keywordMatches.length / Math.max(keywordsLower.length, 1)) * 0.3;

      return {
        ...article,
        relevanceScore: Math.min(score, 1),
      };
    });
  }

  /**
   * Calculate confidence based on news coverage
   */
  private calculateConfidence(relevantArticles: NewsArticle[]): number {
    if (relevantArticles.length === 0) {
      return 0;
    }

    // Base confidence from number of articles
    const articleConfidence = Math.min(relevantArticles.length * 10, 50);

    // Average relevance score
    const avgRelevance =
      relevantArticles.reduce((sum, a) => sum + (a.relevanceScore || 0), 0) /
      relevantArticles.length;

    // Combined confidence
    return Math.round(articleConfidence + avgRelevance * 50);
  }
}

export default NewsService;
