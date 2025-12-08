import { db } from '../server/db';
import { news, teamMembers, newsTeamMembers, practiceGroups } from '../shared/schema';
import { eq, or, ilike } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

interface ExtractedArticle {
  filename: string;
  title: string;
  titleEs: string;
  excerpt: string;
  excerptEs: string;
  content: string;
  contentEs: string;
  date: string;
  authors: string[];
  authorEmails: string[];
  category: 'insights' | 'alerts';
  topics: string[];
  slug: string;
}

const TOPIC_TO_PRACTICE_GROUP: Record<string, string> = {
  'energy': 'energy-natural-resources',
  'tax': 'tax',
  'labor': 'labor-employment',
  'competition': 'antitrust-competition',
  'corporate': 'corporate-ma',
  'compliance': 'compliance-investigations',
  'trade': 'international-trade',
  'regulatory': 'regulatory',
  'litigation': 'litigation-arbitration',
  'real-estate': 'real-estate',
  'data-protection': 'data-protection-privacy',
  'government-contracts': 'government-contracts',
};

async function findTeamMemberByEmail(email: string): Promise<string | null> {
  const cleanEmail = email.toLowerCase().trim();
  
  const members = await db.select({ id: teamMembers.id, email: teamMembers.email })
    .from(teamMembers)
    .where(ilike(teamMembers.email, `%${cleanEmail.split('@')[0]}%`));
  
  if (members.length > 0) {
    return members[0].id;
  }
  
  return null;
}

async function findTeamMemberByName(name: string): Promise<string | null> {
  const cleanName = name.trim().toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/contactar\n?/gi, '')
    .replace(/mx\n?/gi, '')
    .trim();
  
  if (cleanName.length < 3) return null;
  
  const nameParts = cleanName.split(' ').filter(p => p.length > 2);
  if (nameParts.length === 0) return null;
  
  const lastName = nameParts[nameParts.length - 1];
  
  const members = await db.select({ id: teamMembers.id, name: teamMembers.name })
    .from(teamMembers)
    .where(ilike(teamMembers.name, `%${lastName}%`));
  
  if (members.length > 0) {
    for (const member of members) {
      const memberNameLower = member.name.toLowerCase();
      if (nameParts.every(part => memberNameLower.includes(part))) {
        return member.id;
      }
    }
    return members[0].id;
  }
  
  return null;
}

async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await db.select({ id: news.id })
      .from(news)
      .where(eq(news.slug, slug));
    
    if (existing.length === 0) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

async function importArticle(article: ExtractedArticle): Promise<{ success: boolean; newsId?: string; error?: string }> {
  try {
    const uniqueSlug = await generateUniqueSlug(article.slug);
    
    const dateToUse = new Date(article.date);
    if (isNaN(dateToUse.getTime())) {
      dateToUse.setTime(Date.now());
    }
    
    const [inserted] = await db.insert(news).values({
      title: article.title,
      titleEs: article.titleEs,
      excerpt: article.excerpt,
      excerptEs: article.excerptEs,
      content: article.content,
      contentEs: article.contentEs,
      slug: uniqueSlug,
      date: dateToUse,
      published: true,
      category: article.category,
      categoryEs: article.category === 'alerts' ? 'Alertas' : 'Insights',
    }).returning({ id: news.id });
    
    const newsId = inserted.id;
    
    const linkedAuthors: string[] = [];
    
    for (const email of article.authorEmails) {
      const memberId = await findTeamMemberByEmail(email);
      if (memberId && !linkedAuthors.includes(memberId)) {
        await db.insert(newsTeamMembers).values({
          newsId,
          teamMemberId: memberId,
        });
        linkedAuthors.push(memberId);
      }
    }
    
    for (const authorName of article.authors) {
      const memberId = await findTeamMemberByName(authorName);
      if (memberId && !linkedAuthors.includes(memberId)) {
        await db.insert(newsTeamMembers).values({
          newsId,
          teamMemberId: memberId,
        });
        linkedAuthors.push(memberId);
      }
    }
    
    return { success: true, newsId };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function main() {
  const jsonPath = path.resolve('attached_assets/extracted_articles.json');
  const articles: ExtractedArticle[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  
  console.log(`Importing ${articles.length} articles...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const article of articles) {
    console.log(`\nImporting: ${article.title.substring(0, 50)}...`);
    
    const result = await importArticle(article);
    
    if (result.success) {
      successCount++;
      console.log(`  Success: ${result.newsId}`);
    } else {
      errorCount++;
      console.log(`  Error: ${result.error}`);
    }
  }
  
  console.log(`\n=== Import Complete ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  
  const totalNews = await db.select({ id: news.id }).from(news);
  console.log(`Total articles in database: ${totalNews.length}`);
  
  process.exit(0);
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
