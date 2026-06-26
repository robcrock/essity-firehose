/**
 * AI-powered review classification script.
 * 
 * This script uses AI SDK 6 with the Vercel AI Gateway to classify each review
 * into categories (bug, feature_request, clinical_concern, positive, other)
 * and extract key phrases.
 * 
 * Run with: node scripts/classify-reviews.mjs
 */

import { generateText, Output } from "ai";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";

// Classification schema
const classificationSchema = z.object({
  category: z.enum(['bug', 'feature_request', 'clinical_concern', 'positive', 'other']),
  keyPhrases: z.array(z.string()),
  sentiment: z.enum(['negative', 'neutral', 'positive']),
});

// Rate limiting helper
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Classify a single review
async function classifyReview(review) {
  const reviewText = [review.title, review.body].filter(Boolean).join(" - ");
  
  const prompt = `Analyze this app review for FreeStyle Libre (a diabetes glucose monitoring app).

Review (Rating: ${review.rating}/5):
"${reviewText}"

Classify this review into ONE of these categories:
- bug: Technical issues, crashes, errors, connectivity problems, sensor pairing issues
- feature_request: Suggestions for new features or improvements
- clinical_concern: Health/medical accuracy concerns, incorrect readings, safety issues
- positive: Generally positive feedback, praise, satisfaction
- other: Doesn't fit other categories

Also extract 3-5 key phrases that capture the main issues or themes mentioned.

Determine the overall sentiment (negative, neutral, or positive) based on the tone.`;

  try {
    const result = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      output: Output.object({ schema: classificationSchema }),
    });

    const classification = result.object;
    
    return {
      ...review,
      category: classification.category,
      keyPhrases: classification.keyPhrases.slice(0, 5),
      sentiment: classification.sentiment,
    };
  } catch (error) {
    console.error(`Failed to classify review ${review.id}:`, error);
    // Fallback classification based on rating
    return {
      ...review,
      category: review.rating >= 4 ? 'positive' : 'other',
      keyPhrases: [],
      sentiment: review.rating >= 4 ? 'positive' : review.rating <= 2 ? 'negative' : 'neutral',
    };
  }
}

// Process reviews in batches
async function classifyReviews(reviews, batchSize = 5, delayMs = 500) {
  const results = [];
  const total = reviews.length;
  
  for (let i = 0; i < reviews.length; i += batchSize) {
    const batch = reviews.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(total / batchSize);
    
    console.log(`Processing batch ${batchNum}/${totalBatches} (reviews ${i + 1}-${Math.min(i + batchSize, total)} of ${total})`);
    
    const batchResults = await Promise.all(batch.map(classifyReview));
    results.push(...batchResults);
    
    // Rate limiting delay between batches
    if (i + batchSize < reviews.length) {
      await sleep(delayMs);
    }
  }
  
  return results;
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
  const classifiedReviews = await classifyReviews(data.reviews, 5, 300);
  
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
  console.log(`\nClassified reviews written to: ${outputPath}`);
  
  // Print summary
  const categoryCounts = {
    bug: 0,
    feature_request: 0,
    clinical_concern: 0,
    positive: 0,
    other: 0,
  };
  
  for (const review of classifiedReviews) {
    categoryCounts[review.category]++;
  }
  
  console.log("\nCategory breakdown:");
  for (const [category, count] of Object.entries(categoryCounts)) {
    const pct = ((count / classifiedReviews.length) * 100).toFixed(1);
    console.log(`  ${category}: ${count} (${pct}%)`);
  }
}

main().catch(console.error);
