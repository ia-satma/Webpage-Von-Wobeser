import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  publishedArticleCompletenessIssues,
  shouldAuditCachedTranslationLanguage,
} from '../agents/systemHealthPolicy';
import {
  mediaItemIsReferenced,
  mediaReferenceKeys,
} from '../media/mediaReferencePolicy';

test('las fichas bibliográficas sin cuerpo no se reportan como publicaciones incompletas', () => {
  assert.deepEqual(publishedArticleCompletenessIssues({
    category: 'articles',
    title: 'Blockchain and Compliance, Mundo Ejecutivo (2023)',
    excerpt: 'Blockchain and Compliance, Mundo Ejecutivo (2023)',
    excerptEs: 'Blockchain y Compliance, Mundo Ejecutivo (2023)',
    content: null,
    contentEs: null,
  }), []);

  assert.deepEqual(publishedArticleCompletenessIssues({
    category: 'articles',
    title: 'Historic publication',
    excerpt: '',
    excerptEs: '',
    content: null,
    contentEs: null,
    sourceUrl: 'https://www.vonwobeser.com/original-publication.pdf',
  }), []);

  assert.deepEqual(publishedArticleCompletenessIssues({
    category: 'news',
    title: 'English title',
    excerpt: 'English excerpt',
    excerptEs: 'Extracto',
    content: null,
    contentEs: '<p>Contenido fuente.</p>',
  }), ['missing English content']);
});

test('el auditor lingüístico omite ubicaciones y conserva campos editoriales', () => {
  assert.equal(shouldAuditCachedTranslationLanguage('location'), false);
  assert.equal(shouldAuditCachedTranslationLanguage('address'), false);
  assert.equal(shouldAuditCachedTranslationLanguage('content'), true);
  assert.equal(shouldAuditCachedTranslationLanguage(null), true);
});

test('los recursos usados fuera de noticias dejan de aparecer como huérfanos', () => {
  const references = new Set([
    '/images/recognitions/2026/chambers-global-2026.webp',
    '/uploads/hero.mp4',
  ]);
  assert.equal(mediaItemIsReferenced({
    path: '/images/recognitions/2026/chambers-global-2026.webp',
    filename: '1.png',
  }, references), true);
  assert.equal(mediaItemIsReferenced({ path: '/uploads/hero.mp4?v=2', filename: 'hero.mp4' }, references), true);
  assert.equal(mediaItemIsReferenced({ path: '/uploads/unused.png', filename: 'unused.png' }, references), false);
  assert.deepEqual(mediaReferenceKeys('/uploads/hero.mp4?v=2'), ['/uploads/hero.mp4?v=2', '/uploads/hero.mp4']);
});

test('el inventario de uso cubre los módulos públicos y la configuración del sitio', () => {
  const source = fs.readFileSync(new URL('../media/mediaReferences.ts', import.meta.url), 'utf8');
  for (const expected of [
    'practiceGroups.imageUrl',
    'industryGroups.imageUrl',
    'news.imageUrl',
    'teamMembers.imageUrl',
    'officeImages.imageUrl',
    'offices.imageUrl',
    'testimonials.authorPhotoUrl',
    'rankings.logoUrl',
    'awards.logoUrl',
    'awards.certificateUrl',
    'representativeClients.logoUrl',
    'alliances.logoUrl',
    'specializedDesks.imageUrl',
    'events.imageUrl',
    'proBonoProjects.imageUrl',
    'diversityInitiatives.imageUrl',
    'banners.imageUrlMobile',
    'generatedImages.imageUrl',
    'generatedAudio.audioUrl',
    'generatedPresentations.pptxUrl',
    'generatedPresentations.pdfUrl',
    'generatedPresentations.pngUrls',
    'getConfigMap()',
  ]) {
    assert.match(source, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
