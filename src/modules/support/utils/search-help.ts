import type { HelpArticle } from '@/services/support';
import type { SupportCategory } from '@/types/support';

/**
 * Finding an answer.
 *
 * ## Deterministic, and honest about being so
 *
 * This is a scored substring match over titles, keywords and categories.
 * It is **not** an assistant, and nothing in the product calls it one: there is
 * no model here, no generated answer and no chat. A customer typing "maturity"
 * gets the articles about maturity, in a predictable order, every time.
 *
 * A future assistant is a different component reading the same content. Pretending
 * to be one now would mean writing answers nobody wrote.
 *
 * ## The ranking, and why
 *
 * A title match beats a keyword match beats a category match, and an exact word
 * beats a partial one. That ordering is what makes "maturity date" put the
 * article called *Where can I see my maturity date?* first rather than fourth —
 * which is the whole difference between search that works and search that
 * technically returns results.
 *
 * Pure and React-free.
 */

const TITLE_SCORE = 10;
const KEYWORD_SCORE = 6;
const SUMMARY_SCORE = 3;
const CATEGORY_SCORE = 2;
/** An exact word rather than a fragment inside another word. */
const WHOLE_WORD_BONUS = 4;

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

/** The words a customer typed, ignoring anything too short to discriminate. */
export function searchTerms(query: string): string[] {
  return normalise(query)
    .split(/\s+/)
    .filter((term) => term.length >= 2);
}

function scoreField(field: string, term: string, weight: number): number {
  const haystack = normalise(field);
  if (!haystack.includes(term)) return 0;

  const whole = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(haystack);
  return weight + (whole ? WHOLE_WORD_BONUS : 0);
}

function scoreArticle(article: HelpArticle, terms: readonly string[]): number {
  return terms.reduce((total, term) => {
    const keywordScore = article.keywords.reduce(
      (best, keyword) => Math.max(best, scoreField(keyword, term, KEYWORD_SCORE)),
      0,
    );

    return (
      total +
      scoreField(article.title, term, TITLE_SCORE) +
      keywordScore +
      scoreField(article.summary, term, SUMMARY_SCORE) +
      scoreField(article.category, term, CATEGORY_SCORE)
    );
  }, 0);
}

export interface HelpSearchResult {
  article: HelpArticle;
  score: number;
}

/**
 * Articles matching the query, best first.
 *
 * An empty or too-short query returns nothing rather than everything: a
 * results list that appears before the customer has typed anything is noise,
 * and the screen shows the topics instead.
 */
export function searchHelp(query: string, articles: readonly HelpArticle[]): HelpSearchResult[] {
  const terms = searchTerms(query);
  if (terms.length === 0) return [];

  return articles
    .map((article) => ({ article, score: scoreArticle(article, terms) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title));
}

/** Every article in one category, in the order they are written. */
export function articlesInCategory(
  category: SupportCategory,
  articles: readonly HelpArticle[],
): HelpArticle[] {
  return articles.filter((article) => article.category === category);
}
