import { db } from '../db';
import { teamMembers } from '@shared/schema';
import { eq, or, ilike } from 'drizzle-orm';
import { openai } from '../openai';

async function generateBio(name: string, role: string, roleEs: string): Promise<{ bioEs: string; bio: string }> {
  const prompt = `Eres un experto en comunicación corporativa para un despacho de abogados mexicano de primer nivel (Von Wobeser y Sierra). 

Genera una biografía profesional BREVE (2-3 oraciones, máximo 150 palabras) para un asociado con los siguientes datos:
- Nombre: ${name}
- Área de práctica: ${roleEs || role}

La biografía debe:
1. Ser profesional pero accesible
2. Mencionar su especialización en el área de práctica indicada
3. Destacar su compromiso con brindar soluciones legales efectivas
4. NO inventar títulos académicos específicos, universidades ni años de experiencia
5. Usar lenguaje formal pero no pomposo

Responde SOLO con un JSON válido en este formato:
{
  "bioEs": "Biografía en español...",
  "bio": "Biography in English..."
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error(`Error generating bio for ${name}:`, error);
    return {
      bioEs: `${name} es asociado/a en Von Wobeser y Sierra, especializado/a en ${roleEs || role}. Se dedica a brindar soluciones legales estratégicas y efectivas a los clientes del despacho.`,
      bio: `${name} is an associate at Von Wobeser y Sierra, specializing in ${role || roleEs}. They are dedicated to providing strategic and effective legal solutions to the firm's clients.`
    };
  }
}

async function main() {
  console.log('Fetching associates without bios...');
  
  const associates = await db
    .select()
    .from(teamMembers)
    .where(
      or(
        ilike(teamMembers.title, '%associate%'),
        ilike(teamMembers.title, '%asociad%')
      )
    );

  const associatesWithoutBio = associates.filter(
    a => !a.bioEs || a.bioEs.trim() === ''
  );

  console.log(`Found ${associatesWithoutBio.length} associates without bios`);

  let updated = 0;
  let failed = 0;

  for (const associate of associatesWithoutBio) {
    console.log(`Generating bio for: ${associate.name} (${associate.roleEs || associate.role})`);
    
    try {
      const bios = await generateBio(
        associate.name,
        associate.role || 'Corporate Law',
        associate.roleEs || 'Derecho Corporativo'
      );

      await db
        .update(teamMembers)
        .set({
          bioEs: bios.bioEs,
          bio: bios.bio,
        })
        .where(eq(teamMembers.id, associate.id));

      updated++;
      console.log(`  ✓ Updated bio for ${associate.name}`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`  ✗ Failed to update ${associate.name}:`, error);
      failed++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Failed: ${failed}`);
}

main().catch(console.error);
