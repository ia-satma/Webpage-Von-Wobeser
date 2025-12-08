import { PDFParse } from 'pdf-parse';
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

const PRACTICE_AREA_KEYWORDS: Record<string, string[]> = {
  'energy': ['energía', 'energy', 'electricidad', 'electric', 'hidrocarburos', 'hydrocarbons', 'petróleo', 'gas', 'renovable', 'CFE', 'pemex'],
  'tax': ['fiscal', 'tax', 'impuesto', 'SAT', 'UMA', 'tributario', 'IMMEX', 'aranceles', 'estímulos fiscales'],
  'labor': ['laboral', 'labor', 'trabajo', 'empleo', 'salario', 'IMSS', 'INFONAVIT', 'ley silla', 'acoso', 'REPSE', 'subcontratación'],
  'competition': ['competencia', 'competition', 'antimonopolio', 'COFECE', 'LFCE'],
  'corporate': ['corporativo', 'corporate', 'M&A', 'fusiones', 'adquisiciones', 'societario'],
  'compliance': ['compliance', 'cumplimiento', 'antilavado', 'PLD', 'LFPIORPI', 'prevención', 'corrupción', 'FCPA'],
  'trade': ['comercio', 'trade', 'T-MEC', 'USMCA', 'aduanas', 'importación', 'exportación', 'aranceles'],
  'regulatory': ['regulatorio', 'regulatory', 'permisos', 'licencias', 'autorizaciones'],
  'litigation': ['litigio', 'litigation', 'controversia', 'arbitraje', 'disputa'],
  'real-estate': ['inmobiliario', 'real estate', 'inmuebles', 'propiedad'],
  'data-protection': ['datos personales', 'data protection', 'privacidad', 'INAI', 'transparencia'],
  'government-contracts': ['adquisiciones', 'contratación pública', 'sector público', 'licitación'],
};

const ATTORNEY_EMAIL_MAP: Record<string, string> = {
  'rafael vallejo': 'rvallejo@vwys.com.mx',
  'adrián castillo': 'adcastillo@vwys.com.mx',
  'adrian castillo': 'adcastillo@vwys.com.mx',
  'claus von wobeser': 'cvonwobeser@vwys.com.mx',
  'luis burgueño': 'lburgueno@vwys.com.mx',
  'luis burgueno': 'lburgueno@vwys.com.mx',
};

function extractDateFromFilename(filename: string): string | null {
  const patterns = [
    /^(\d{4})-(\d{2})-(\d{2})/,
    /^(\d{2})_(\d{2})_(\d{2})/,
  ];
  
  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) {
      if (pattern === patterns[0]) {
        return `${match[1]}-${match[2]}-${match[3]}`;
      } else {
        const year = parseInt(match[1]) > 50 ? `19${match[1]}` : `20${match[1]}`;
        return `${year}-${match[2]}-${match[3]}`;
      }
    }
  }
  return null;
}

function extractDateFromText(text: string): string | null {
  const spanishMonths: Record<string, string> = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
    'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
  };
  
  const pattern = /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})/i;
  const match = text.match(pattern);
  
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = spanishMonths[match[2].toLowerCase()];
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  return null;
}

function extractAuthors(text: string): { names: string[], emails: string[] } {
  const names: string[] = [];
  const emails: string[] = [];
  
  const emailPattern = /([A-Za-zÁáÉéÍíÓóÚúÑñ\s]+),\s*(?:Socio|Partner|Of Counsel|Asociado|Associate)[:\s]*[^@]*?([a-z]+@vwys\.com\.mx)/gi;
  let match;
  
  while ((match = emailPattern.exec(text)) !== null) {
    const name = match[1].trim();
    const email = match[2].toLowerCase();
    if (name && email && !names.includes(name)) {
      names.push(name);
      emails.push(email);
    }
  }
  
  if (names.length === 0) {
    const contactPattern = /([A-Za-zÁáÉéÍíÓóÚúÑñ\s]+)(?:,\s*(?:Socio|Partner))?[:\s]*\+52[^|]+\|\s*([a-z]+@vwys\.com\.mx)/gi;
    while ((match = contactPattern.exec(text)) !== null) {
      const name = match[1].trim().replace(/Para obtener información adicional, contactar a:/i, '').trim();
      const email = match[2].toLowerCase();
      if (name && email && name.length < 50 && !names.includes(name)) {
        names.push(name);
        emails.push(email);
      }
    }
  }
  
  return { names, emails };
}

function extractTitle(text: string, filename: string): string {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (line.length > 20 && line.length < 200 && !line.includes('@') && !line.includes('www.')) {
      return line;
    }
  }
  
  return filename.replace('.pdf', '').replace(/-/g, ' ').replace(/_/g, ' ');
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
    .replace(/-$/, '');
}

function detectTopics(text: string): string[] {
  const lowerText = text.toLowerCase();
  const detectedTopics: string[] = [];
  
  for (const [topic, keywords] of Object.entries(PRACTICE_AREA_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        if (!detectedTopics.includes(topic)) {
          detectedTopics.push(topic);
        }
        break;
      }
    }
  }
  
  return detectedTopics.length > 0 ? detectedTopics : ['regulatory'];
}

function generateExcerpt(content: string, maxLength: number = 300): string {
  const cleanContent = content
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }
  
  const truncated = cleanContent.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastPeriod > maxLength * 0.7) {
    return truncated.substring(0, lastPeriod + 1);
  } else if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

function cleanContent(text: string): string {
  return text
    .replace(/-- \d+ of \d+ --/g, '')
    .replace(/VON WOBESER Y SIERRA, S\.C\./g, '')
    .replace(/Paseo de los Tamarindos 60, 05120 Ciudad de México/g, '')
    .replace(/\+52 \(55\) 5258 1000/g, '')
    .replace(/vonwobeser\.com/g, '')
    .replace(/La información incluida en esta nota no constituye.*?abogados aquí mencionados\./gs, '')
    .replace(/A T E N T A M E N T E/g, '')
    .replace(/Para obtener información adicional, contactar a:/g, '')
    .replace(/[a-z]+@vwys\.com\.mx/gi, '')
    .replace(/\+52 \(55\) \d{4}[- ]\d{4}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractArticle(pdfPath: string): Promise<ExtractedArticle | null> {
  try {
    const filename = path.basename(pdfPath);
    const parser = new PDFParse({ url: 'file://' + path.resolve(pdfPath) });
    const result = await parser.getText();
    
    const rawText = result.text;
    const cleanedContent = cleanContent(rawText);
    
    const title = extractTitle(rawText, filename);
    const date = extractDateFromFilename(filename) || extractDateFromText(rawText) || new Date().toISOString().split('T')[0];
    const { names: authors, emails: authorEmails } = extractAuthors(rawText);
    const topics = detectTopics(rawText);
    const slug = generateSlug(title);
    const excerpt = generateExcerpt(cleanedContent);
    
    const category = filename.toLowerCase().includes('flash') ? 'alerts' : 'insights';
    
    return {
      filename,
      title,
      titleEs: title,
      excerpt,
      excerptEs: excerpt,
      content: cleanedContent,
      contentEs: cleanedContent,
      date,
      authors,
      authorEmails,
      category,
      topics,
      slug,
    };
  } catch (error) {
    console.error(`Error extracting ${pdfPath}:`, error);
    return null;
  }
}

async function main() {
  const articlesDir = path.resolve('attached_assets/articles_extracted/Articulos Von Wobeser');
  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.pdf'));
  
  console.log(`Found ${files.length} PDF files to process`);
  
  const articles: ExtractedArticle[] = [];
  
  for (const file of files) {
    const pdfPath = path.join(articlesDir, file);
    console.log(`Processing: ${file}`);
    
    const article = await extractArticle(pdfPath);
    if (article) {
      articles.push(article);
      console.log(`  Title: ${article.title.substring(0, 60)}...`);
      console.log(`  Date: ${article.date}`);
      console.log(`  Authors: ${article.authors.join(', ') || 'Unknown'}`);
      console.log(`  Topics: ${article.topics.join(', ')}`);
    }
  }
  
  console.log(`\nSuccessfully extracted ${articles.length} articles`);
  
  const outputPath = path.resolve('attached_assets/extracted_articles.json');
  fs.writeFileSync(outputPath, JSON.stringify(articles, null, 2));
  console.log(`\nSaved to: ${outputPath}`);
  
  console.log('\n=== Topic Distribution ===');
  const topicCounts: Record<string, number> = {};
  for (const article of articles) {
    for (const topic of article.topics) {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    }
  }
  Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([topic, count]) => console.log(`  ${topic}: ${count}`));
}

main().catch(console.error);
