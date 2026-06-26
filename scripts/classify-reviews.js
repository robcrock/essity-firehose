/**
 * Review classification script using keyword matching.
 * 
 * This script classifies each review into categories:
 * - bug: Technical issues, crashes, errors, connectivity problems
 * - feature_request: Suggestions for new features or improvements
 * - clinical_concern: Health/medical accuracy concerns, incorrect readings
 * - positive: Generally positive feedback, praise
 * - other: Doesn't fit other categories
 * 
 * Run with: node scripts/classify-reviews.js
 */

const fs = require("node:fs/promises");
const path = require("node:path");

// Keyword patterns for classification
const CATEGORY_PATTERNS = {
  bug: [
    /crash(es|ed|ing)?/i,
    /bug(s|gy)?/i,
    /error(s)?/i,
    /freez(e|es|ing)/i,
    /not (working|loading|connecting|syncing)/i,
    /won'?t (work|load|connect|sync|open|start)/i,
    /doesn'?t (work|load|connect|sync|open|start)/i,
    /fail(s|ed|ing)?/i,
    /broken/i,
    /glitch(y|es)?/i,
    /bluetooth (issue|problem|error|disconnect)/i,
    /connection (issue|problem|error|lost|fail)/i,
    /sensor (not|won't|doesn't|fail|error)/i,
    /app (closes|quit|stops|force)/i,
    /black screen/i,
    /white screen/i,
    /stuck on/i,
    /can'?t (connect|pair|scan|sync|log|sign)/i,
    /keeps (crashing|closing|stopping|freezing)/i,
    /constantly (crash|close|freeze)/i,
    /battery drain/i,
    /notification(s)? (not|don't|won't)/i,
    /alarm(s)? (not|don't|won't)/i,
  ],
  clinical_concern: [
    /inaccurate/i,
    /accuracy/i,
    /wrong reading/i,
    /incorrect reading/i,
    /false (high|low|reading|alarm|alert)/i,
    /blood sugar (differ|wrong|off|inaccurate)/i,
    /glucose (differ|wrong|off|inaccurate)/i,
    /reading(s)? (are|is|was|were) (off|wrong|different)/i,
    /doesn'?t match (finger|blood|meter)/i,
    /not accurate/i,
    /unreliable/i,
    /dangerous/i,
    /health risk/i,
    /medical (issue|concern|problem)/i,
    /insulin dos(e|ing|age)/i,
    /hypoglycemia/i,
    /hyperglycemia/i,
    /\d+ points? (off|different)/i,
    /mg\/dl (off|different)/i,
    /life threatening/i,
    /could (kill|die|harm)/i,
    /trust (this|the|my) (reading|sensor|app)/i,
  ],
  feature_request: [
    /please add/i,
    /should (have|add|include|allow)/i,
    /would (like|love|be nice) (to|if)/i,
    /wish (there|it|you|the app) (was|were|had|would)/i,
    /need(s)? (to add|a feature|an option)/i,
    /feature request/i,
    /suggestion/i,
    /it would be (great|nice|better|helpful)/i,
    /can you (add|make|include)/i,
    /hoping (for|to see)/i,
    /why (can't|doesn't|isn't|won't) (it|the app)/i,
    /missing feature/i,
    /want (to be able|the ability)/i,
    /option to/i,
    /ability to/i,
    /integrate with/i,
    /integration/i,
    /widget/i,
    /apple watch/i,
    /dark mode/i,
    /export (data|csv|pdf)/i,
    /share (data|with|to)/i,
  ],
  positive: [
    /love (this|the) app/i,
    /great app/i,
    /amazing app/i,
    /awesome app/i,
    /excellent app/i,
    /fantastic app/i,
    /wonderful app/i,
    /best app/i,
    /perfect app/i,
    /works (great|perfectly|well|fine|good)/i,
    /life( |-)?(saver|saving|changing|changer)/i,
    /game( |-)?(changer|changing)/i,
    /highly recommend/i,
    /thank(s| you)/i,
    /grateful/i,
    /changed my life/i,
    /easy to use/i,
    /user( |-)?friendly/i,
    /love it/i,
    /five star/i,
    /5 star/i,
    /so happy/i,
    /very happy/i,
    /so glad/i,
    /couldn'?t be happier/i,
  ],
};

// Stop words for phrase extraction
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she',
  'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
  'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that',
  'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an',
  'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of',
  'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
  'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
  'app', 'libre', 'freestyle', 'sensor', 'abbott', 'just', 'get', 'got', 'very',
  'really', 'also', 'even', 'still', 'only', 'now', 'one', 'two', 'first',
  'new', 'way', 'want', 'use', 'using', 'used', 'work', 'when', 'every', 'all',
  'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'nor', 'not', 'only', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can',
  'will', 'just', 'don', 'should', 'now', 'since', 'update', 'updated',
]);

// Classify a review based on keyword matching
function classifyReview(review) {
  const text = [review.title, review.body].filter(Boolean).join(" ").toLowerCase();
  const rating = review.rating;
  
  // Count matches for each category
  const scores = {
    bug: 0,
    clinical_concern: 0,
    feature_request: 0,
    positive: 0,
  };
  
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        scores[category]++;
      }
    }
  }
  
  // Determine category based on scores and rating
  let category = 'other';
  let maxScore = 0;
  
  // If high rating (4-5) and no strong negative signals, lean toward positive
  if (rating >= 4 && scores.bug < 2 && scores.clinical_concern < 2) {
    if (scores.positive >= 1 || (scores.bug === 0 && scores.clinical_concern === 0)) {
      category = 'positive';
      maxScore = Math.max(scores.positive, 1);
    }
  }
  
  // Check for strongest signal
  for (const [cat, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      category = cat;
    }
  }
  
  // If low rating and no clear category, default to bug for very low, other for medium
  if (category === 'other' && maxScore === 0) {
    if (rating <= 2) {
      category = 'bug'; // Most low-rating reviews are about issues
    } else if (rating >= 4) {
      category = 'positive';
    }
  }
  
  // Determine sentiment based on rating
  let sentiment;
  if (rating >= 4) {
    sentiment = 'positive';
  } else if (rating <= 2) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }
  
  // Extract key phrases (bigrams and trigrams)
  const keyPhrases = extractKeyPhrases(text);
  
  return {
    ...review,
    category,
    keyPhrases,
    sentiment,
  };
}

// Extract key phrases from text
function extractKeyPhrases(text) {
  // Clean text and split into words
  const cleaned = text
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  
  const words = cleaned.split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w));
  
  const phrases = [];
  
  // Extract bigrams
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    phrases.push(bigram);
  }
  
  // Add significant single words (longer words often more meaningful)
  for (const word of words) {
    if (word.length >= 5) {
      phrases.push(word);
    }
  }
  
  // Return unique phrases (limit to 5)
  return [...new Set(phrases)].slice(0, 5);
}

// Main function
async function main() {
  const inputPath = path.join(process.cwd(), "data", "reviews.json");
  const outputPath = path.join(process.cwd(), "data", "reviews-classified.json");
  
  console.log("Loading reviews from:", inputPath);
  
  const raw = await fs.readFile(inputPath, "utf8");
  const data = JSON.parse(raw);
  
  console.log(`Found ${data.reviews.length} reviews to classify`);
  console.log(`Apps: ${data.apps.map(a => a.displayName).join(", ")}`);
  
  // Classify all reviews
  console.log("\nClassifying reviews...");
  const classifiedReviews = data.reviews.map(classifyReview);
  
  // Build output file
  const output = {
    generatedAt: data.generatedAt,
    classifiedAt: new Date().toISOString(),
    windowDays: data.windowDays,
    apps: data.apps,
    reviews: classifiedReviews,
  };
  
  // Write output
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2), "utf8");
  console.log(`Classified reviews written to: ${outputPath}`);
  
  // Print summary
  const categoryCounts = {
    bug: 0,
    feature_request: 0,
    clinical_concern: 0,
    positive: 0,
    other: 0,
  };
  
  const sentimentCounts = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };
  
  for (const review of classifiedReviews) {
    categoryCounts[review.category]++;
    sentimentCounts[review.sentiment]++;
  }
  
  console.log("\nCategory breakdown:");
  for (const [category, count] of Object.entries(categoryCounts)) {
    const pct = ((count / classifiedReviews.length) * 100).toFixed(1);
    console.log(`  ${category}: ${count} (${pct}%)`);
  }
  
  console.log("\nSentiment breakdown:");
  for (const [sentiment, count] of Object.entries(sentimentCounts)) {
    const pct = ((count / classifiedReviews.length) * 100).toFixed(1);
    console.log(`  ${sentiment}: ${count} (${pct}%)`);
  }
  
  // Show sample of extracted phrases from low-rated reviews
  const lowRatedPhrases = {};
  for (const review of classifiedReviews.filter(r => r.rating <= 2)) {
    for (const phrase of review.keyPhrases) {
      lowRatedPhrases[phrase] = (lowRatedPhrases[phrase] || 0) + 1;
    }
  }
  
  const topPhrases = Object.entries(lowRatedPhrases)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  console.log("\nTop phrases in low-rated reviews:");
  for (const [phrase, count] of topPhrases) {
    console.log(`  "${phrase}": ${count}`);
  }
}

main().catch(console.error);
