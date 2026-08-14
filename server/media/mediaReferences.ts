import {
  alliances,
  awards,
  banners,
  diversityInitiatives,
  events,
  generatedAudio,
  generatedImages,
  generatedPresentations,
  industryGroups,
  news,
  officeImages,
  offices,
  practiceGroups,
  proBonoProjects,
  rankings,
  representativeClients,
  specializedDesks,
  teamMembers,
  testimonials,
} from '@shared/schema';
import { db } from '../db';
import { getConfigMap } from '../mirror/siteConfig';
import { mediaReferenceKeys } from './mediaReferencePolicy';

export async function loadUsedPublicMediaReferences(): Promise<Set<string>> {
  const [
    practiceRefs,
    industryRefs,
    newsRefs,
    teamRefs,
    officeImageRefs,
    officeRefs,
    testimonialRefs,
    rankingRefs,
    awardRefs,
    clientRefs,
    allianceRefs,
    deskRefs,
    eventRefs,
    proBonoRefs,
    diversityRefs,
    bannerRefs,
    generatedImageRefs,
    generatedAudioRefs,
    generatedPresentationRefs,
    config,
  ] = await Promise.all([
    db.select({ path: practiceGroups.imageUrl }).from(practiceGroups),
    db.select({ path: industryGroups.imageUrl }).from(industryGroups),
    db.select({ path: news.imageUrl }).from(news),
    db.select({ path: teamMembers.imageUrl }).from(teamMembers),
    db.select({ path: officeImages.imageUrl }).from(officeImages),
    db.select({ path: offices.imageUrl }).from(offices),
    db.select({ path: testimonials.authorPhotoUrl }).from(testimonials),
    db.select({ path: rankings.logoUrl }).from(rankings),
    db.select({ path: awards.logoUrl, certificatePath: awards.certificateUrl }).from(awards),
    db.select({ path: representativeClients.logoUrl }).from(representativeClients),
    db.select({ path: alliances.logoUrl }).from(alliances),
    db.select({ path: specializedDesks.imageUrl }).from(specializedDesks),
    db.select({ path: events.imageUrl }).from(events),
    db.select({ path: proBonoProjects.imageUrl }).from(proBonoProjects),
    db.select({ path: diversityInitiatives.imageUrl }).from(diversityInitiatives),
    db.select({ path: banners.imageUrl, mobilePath: banners.imageUrlMobile }).from(banners),
    db.select({ path: generatedImages.imageUrl }).from(generatedImages),
    db.select({ path: generatedAudio.audioUrl }).from(generatedAudio),
    db.select({
      path: generatedPresentations.pptxUrl,
      pdfPath: generatedPresentations.pdfUrl,
      pngPaths: generatedPresentations.pngUrls,
    }).from(generatedPresentations),
    getConfigMap(),
  ]);

  const references = new Set<string>();
  const addReference = (value: unknown) => {
    for (const key of mediaReferenceKeys(value)) references.add(key);
  };
  for (const collection of [
    practiceRefs,
    industryRefs,
    newsRefs,
    teamRefs,
    officeImageRefs,
    officeRefs,
    testimonialRefs,
    rankingRefs,
    clientRefs,
    allianceRefs,
    deskRefs,
    eventRefs,
    proBonoRefs,
    diversityRefs,
    generatedImageRefs,
    generatedAudioRefs,
  ]) {
    for (const item of collection) addReference(item.path);
  }
  for (const item of awardRefs) {
    addReference(item.path);
    addReference(item.certificatePath);
  }
  for (const item of bannerRefs) {
    addReference(item.path);
    addReference(item.mobilePath);
  }
  for (const item of generatedPresentationRefs) {
    addReference(item.path);
    addReference(item.pdfPath);
    for (const pngPath of item.pngPaths || []) addReference(pngPath);
  }
  for (const entry of Object.values(config)) {
    addReference(entry.value);
    addReference(entry.valueEs);
  }
  return references;
}

export { mediaItemIsReferenced } from './mediaReferencePolicy';
