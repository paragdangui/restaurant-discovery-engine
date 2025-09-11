import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { YelpReview } from '../yelp/yelp.service';

export interface UserPreferences {
  cuisineTypes?: string[];
  priceRange?: number[];
  dietaryRestrictions?: string[];
  ambiance?: string[];
  location?: { lat: number; lng: number; radius: number };
  previousLikes?: string[];
  previousDislikes?: string[];
}

export interface RecommendationResult {
  restaurant: Restaurant;
  matchScore: number;
  reasons: string[];
  tags: string[];
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  label: 'positive' | 'neutral' | 'negative';
  confidence: number;
  keywords: string[];
}

export interface ReviewSummary {
  overallSentiment: SentimentAnalysis;
  commonPraises: string[];
  commonComplaints: string[];
  topMentions: { topic: string; sentiment: string; count: number }[];
  recommendationStatus: 'highly_recommended' | 'recommended' | 'mixed' | 'not_recommended';
}

export interface DietaryAnalysis {
  compatibility: number; // 0 to 1
  safeItems: string[];
  riskyItems: string[];
  alternatives: string[];
  warnings: string[];
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not provided. AI features will be disabled.');
    }
  }

  async generateRecommendations(
    restaurants: Restaurant[],
    userPreferences: UserPreferences,
    searchHistory: any[] = []
  ): Promise<RecommendationResult[]> {
    if (!this.openai) {
      // Fallback to basic scoring without AI
      return this.generateBasicRecommendations(restaurants, userPreferences);
    }

    try {
      const prompt = this.buildRecommendationPrompt(restaurants, userPreferences, searchHistory);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a restaurant recommendation expert. Analyze the given restaurants and user preferences to provide personalized recommendations. Return a JSON array of recommendations with matchScore (0-1), reasons, and tags.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      const recommendations = JSON.parse(aiResponse);
      return this.processAIRecommendations(restaurants, recommendations);

    } catch (error) {
      this.logger.error('AI recommendation generation failed', error);
      // Fallback to basic recommendations
      return this.generateBasicRecommendations(restaurants, userPreferences);
    }
  }

  async analyzeReviewSentiment(reviews: YelpReview[]): Promise<SentimentAnalysis[]> {
    if (!this.openai) {
      return this.generateBasicSentiment(reviews);
    }

    try {
      const reviewTexts = reviews.map(r => r.text).slice(0, 10); // Limit to 10 reviews
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Analyze the sentiment of restaurant reviews. Return a JSON array with score (-1 to 1), label (positive/neutral/negative), confidence (0-1), and keywords for each review.`
          },
          {
            role: 'user',
            content: `Analyze these restaurant reviews:\n\n${reviewTexts.map((text, i) => `${i + 1}. ${text}`).join('\n\n')}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      return JSON.parse(aiResponse);

    } catch (error) {
      this.logger.error('AI sentiment analysis failed', error);
      return this.generateBasicSentiment(reviews);
    }
  }

  async summarizeReviews(reviews: YelpReview[]): Promise<ReviewSummary> {
    if (!this.openai) {
      return this.generateBasicSummary(reviews);
    }

    try {
      const reviewTexts = reviews.map(r => `${r.rating}/5: ${r.text}`).slice(0, 15);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Summarize restaurant reviews. Provide overall sentiment, common praises, common complaints, top mentions with sentiment, and recommendation status. Return as JSON.`
          },
          {
            role: 'user',
            content: `Summarize these restaurant reviews:\n\n${reviewTexts.join('\n\n')}`
          }
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      return JSON.parse(aiResponse);

    } catch (error) {
      this.logger.error('AI review summarization failed', error);
      return this.generateBasicSummary(reviews);
    }
  }

  async analyzeDietaryCompatibility(
    menuItems: any[],
    dietaryRestrictions: string[]
  ): Promise<DietaryAnalysis> {
    if (!this.openai || !menuItems.length) {
      return this.generateBasicDietaryAnalysis(menuItems, dietaryRestrictions);
    }

    try {
      const menuText = menuItems.map(item => 
        `${item.name}: ${item.description || ''} - $${item.price || 'N/A'}`
      ).join('\n');

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Analyze menu items for dietary restrictions compatibility. Return JSON with compatibility score (0-1), safe items, risky items, alternatives, and warnings.`
          },
          {
            role: 'user',
            content: `Analyze this menu for dietary restrictions: ${dietaryRestrictions.join(', ')}\n\nMenu:\n${menuText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      return JSON.parse(aiResponse);

    } catch (error) {
      this.logger.error('AI dietary analysis failed', error);
      return this.generateBasicDietaryAnalysis(menuItems, dietaryRestrictions);
    }
  }

  async generateDiningSuggestions(context: {
    occasion?: string;
    timeOfDay?: string;
    weather?: string;
    groupSize?: number;
    budget?: string;
    location?: string;
  }): Promise<string[]> {
    if (!this.openai) {
      return this.generateBasicSuggestions(context);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Generate personalized dining suggestions based on context. Return a JSON array of specific, actionable suggestions.`
          },
          {
            role: 'user',
            content: `Generate dining suggestions for: ${JSON.stringify(context)}`
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      return JSON.parse(aiResponse);

    } catch (error) {
      this.logger.error('AI dining suggestions failed', error);
      return this.generateBasicSuggestions(context);
    }
  }

  // Fallback methods when AI is not available
  private generateBasicRecommendations(
    restaurants: Restaurant[],
    preferences: UserPreferences
  ): RecommendationResult[] {
    return restaurants.map(restaurant => ({
      restaurant,
      matchScore: this.calculateBasicMatchScore(restaurant, preferences),
      reasons: this.generateBasicReasons(restaurant, preferences),
      tags: this.generateBasicTags(restaurant),
    })).sort((a, b) => b.matchScore - a.matchScore);
  }

  private calculateBasicMatchScore(restaurant: Restaurant, preferences: UserPreferences): number {
    let score = 0.5; // Base score

    // Rating factor
    if (restaurant.rating) {
      score += (restaurant.rating - 3) * 0.1; // Boost for rating > 3
    }

    // Review count factor
    if (restaurant.reviewCount > 50) {
      score += 0.1;
    }

    // Price level matching
    if (preferences.priceRange && restaurant.priceLevel) {
      if (preferences.priceRange.includes(restaurant.priceLevel)) {
        score += 0.2;
      }
    }

    // Cuisine matching
    if (preferences.cuisineTypes) {
      const restaurantCuisines = restaurant.categories?.map(cat => cat.title.toLowerCase()) || [];
      const matchingCuisines = preferences.cuisineTypes.filter(cuisine => 
        restaurantCuisines.some(rc => rc.includes(cuisine.toLowerCase()))
      );
      if (matchingCuisines.length > 0) {
        score += 0.2;
      }
    }

    return Math.min(Math.max(score, 0), 1);
  }

  private generateBasicReasons(restaurant: Restaurant, preferences: UserPreferences): string[] {
    const reasons = [];

    if (restaurant.rating && restaurant.rating >= 4.5) {
      reasons.push('Highly rated restaurant');
    }

    if (restaurant.reviewCount > 100) {
      reasons.push('Popular choice with many reviews');
    }

    if (preferences.cuisineTypes && restaurant.categories) {
      const matchingCuisines = restaurant.categories.filter(cat =>
        preferences.cuisineTypes.some(pref => cat.title.toLowerCase().includes(pref.toLowerCase()))
      );
      if (matchingCuisines.length > 0) {
        reasons.push(`Matches your ${matchingCuisines[0].title} preference`);
      }
    }

    return reasons.length > 0 ? reasons : ['Good overall rating and reviews'];
  }

  private generateBasicTags(restaurant: Restaurant): string[] {
    const tags = [];

    if (restaurant.rating && restaurant.rating >= 4.5) tags.push('highly-rated');
    if (restaurant.reviewCount > 100) tags.push('popular');
    if (restaurant.priceLevel === 1) tags.push('budget-friendly');
    if (restaurant.priceLevel === 4) tags.push('upscale');
    if (restaurant.categories) {
      restaurant.categories.forEach(cat => tags.push(cat.alias));
    }

    return tags;
  }

  private generateBasicSentiment(reviews: YelpReview[]): SentimentAnalysis[] {
    return reviews.map(review => ({
      score: (review.rating - 3) / 2, // Convert 1-5 rating to -1 to 1
      label: review.rating >= 4 ? 'positive' : review.rating >= 3 ? 'neutral' : 'negative',
      confidence: 0.7,
      keywords: this.extractBasicKeywords(review.text),
    }));
  }

  private generateBasicSummary(reviews: YelpReview[]): ReviewSummary {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    return {
      overallSentiment: {
        score: (avgRating - 3) / 2,
        label: avgRating >= 4 ? 'positive' : avgRating >= 3 ? 'neutral' : 'negative',
        confidence: 0.7,
        keywords: [],
      },
      commonPraises: ['Good food', 'Nice atmosphere'],
      commonComplaints: ['Long wait times'],
      topMentions: [
        { topic: 'food', sentiment: 'positive', count: reviews.length },
      ],
      recommendationStatus: avgRating >= 4.5 ? 'highly_recommended' : 
                           avgRating >= 4 ? 'recommended' :
                           avgRating >= 3 ? 'mixed' : 'not_recommended',
    };
  }

  private generateBasicDietaryAnalysis(menuItems: any[], restrictions: string[]): DietaryAnalysis {
    return {
      compatibility: 0.5,
      safeItems: menuItems.slice(0, 3).map(item => item.name),
      riskyItems: [],
      alternatives: ['Ask server for modifications'],
      warnings: restrictions.length > 0 ? ['Please verify ingredients with restaurant'] : [],
    };
  }

  private generateBasicSuggestions(context: any): string[] {
    const suggestions = [
      'Try a local favorite restaurant',
      'Consider checking the restaurant hours before visiting',
      'Read recent reviews for current experience quality',
    ];

    if (context.occasion === 'date') {
      suggestions.push('Look for restaurants with romantic ambiance');
    }

    return suggestions;
  }

  private extractBasicKeywords(text: string): string[] {
    const positiveWords = ['great', 'excellent', 'amazing', 'delicious', 'perfect'];
    const negativeWords = ['terrible', 'awful', 'bad', 'horrible', 'disappointing'];
    
    const words = text.toLowerCase().split(/\s+/);
    return [...positiveWords, ...negativeWords].filter(word => words.includes(word));
  }

  private buildRecommendationPrompt(
    restaurants: Restaurant[],
    preferences: UserPreferences,
    searchHistory: any[]
  ): string {
    return `
Analyze these restaurants and user preferences to generate personalized recommendations:

Restaurants: ${JSON.stringify(restaurants.slice(0, 10))} // Limit for token management

User Preferences: ${JSON.stringify(preferences)}

Search History: ${JSON.stringify(searchHistory.slice(0, 5))}

Return a JSON array with objects containing:
- restaurantId: number
- matchScore: number (0-1)
- reasons: string[]
- tags: string[]
    `;
  }

  private processAIRecommendations(restaurants: Restaurant[], aiRecommendations: any[]): RecommendationResult[] {
    return aiRecommendations
      .map(rec => {
        const restaurant = restaurants.find(r => r.id === rec.restaurantId);
        return restaurant ? {
          restaurant,
          matchScore: rec.matchScore,
          reasons: rec.reasons || [],
          tags: rec.tags || [],
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.matchScore - a.matchScore);
  }
}