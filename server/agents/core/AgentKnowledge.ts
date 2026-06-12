import { KnowledgeDocument, AgentType } from './types';
import { dbPersistence } from '../storage/DatabasePersistence';

export class AgentKnowledgeStore {
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    console.log('[AgentKnowledge] Initializing knowledge store with database persistence...');
    this.initialized = true;
  }

  async addDocument(doc: Omit<KnowledgeDocument, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<KnowledgeDocument> {
    try {
      const dbDoc = await dbPersistence.createKnowledge({
        agentType: doc.agentType,
        category: doc.category,
        title: doc.title,
        content: doc.content,
        metadata: doc.metadata,
      });

      return {
        id: dbDoc.id,
        agentType: dbDoc.agentType as AgentType,
        category: dbDoc.category,
        title: dbDoc.title,
        content: dbDoc.content,
        metadata: dbDoc.metadata as Record<string, unknown>,
        usageCount: dbDoc.usageCount || 0,
        createdAt: dbDoc.createdAt || new Date(),
        updatedAt: dbDoc.updatedAt || new Date(),
      };
    } catch (error) {
      console.error('[AgentKnowledge] Failed to add document to database:', error);
      throw new Error(`Failed to persist knowledge document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getDocuments(agentType: AgentType): Promise<KnowledgeDocument[]> {
    const dbDocs = await dbPersistence.getKnowledgeByAgent(agentType);
    
    return dbDocs.map(doc => ({
      id: doc.id,
      agentType: doc.agentType as AgentType,
      category: doc.category,
      title: doc.title,
      content: doc.content,
      metadata: doc.metadata as Record<string, unknown>,
      usageCount: doc.usageCount || 0,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    }));
  }

  async searchDocuments(
    agentType: AgentType,
    query: string,
    options?: { category?: string; limit?: number }
  ): Promise<KnowledgeDocument[]> {
    const dbDocs = await dbPersistence.searchKnowledge(
      agentType,
      query,
      options?.category,
      options?.limit || 10
    );
    
    return dbDocs.map(doc => ({
      id: doc.id,
      agentType: doc.agentType as AgentType,
      category: doc.category,
      title: doc.title,
      content: doc.content,
      metadata: doc.metadata as Record<string, unknown>,
      usageCount: doc.usageCount || 0,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    }));
  }

  async updateDocument(id: string, updates: Partial<KnowledgeDocument>): Promise<KnowledgeDocument | null> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.content) dbUpdates.content = updates.content;
    if (updates.metadata) dbUpdates.metadata = updates.metadata;
    if (updates.usageCount !== undefined) dbUpdates.usageCount = updates.usageCount;

    const dbDoc = await dbPersistence.updateKnowledge(id, dbUpdates);
    if (!dbDoc) return null;

    return {
      id: dbDoc.id,
      agentType: dbDoc.agentType as AgentType,
      category: dbDoc.category,
      title: dbDoc.title,
      content: dbDoc.content,
      metadata: dbDoc.metadata as Record<string, unknown>,
      usageCount: dbDoc.usageCount || 0,
      createdAt: dbDoc.createdAt || new Date(),
      updatedAt: dbDoc.updatedAt || new Date(),
    };
  }

  async deleteDocument(id: string): Promise<boolean> {
    return dbPersistence.deleteKnowledge(id);
  }

  async getStats(agentType?: AgentType): Promise<{
    totalDocuments: number;
    byAgent: Record<AgentType, number>;
    byCategory: Record<string, number>;
    mostUsed: KnowledgeDocument[];
  }> {
    const stats = await dbPersistence.getKnowledgeStats(agentType);
    
    return {
      totalDocuments: stats.totalDocuments,
      byAgent: stats.byAgent as Record<AgentType, number>,
      byCategory: stats.byCategory,
      mostUsed: stats.mostUsed.map(doc => ({
        id: doc.id,
        agentType: doc.agentType as AgentType,
        category: doc.category,
        title: doc.title,
        content: doc.content,
        metadata: doc.metadata as Record<string, unknown>,
        usageCount: doc.usageCount || 0,
        createdAt: doc.createdAt || new Date(),
        updatedAt: doc.updatedAt || new Date(),
      })),
    };
  }

  async addLegalGlossary(): Promise<void> {
    const existingDocs = await this.getDocuments('polyglot_translator');
    const glossaryDocs = existingDocs.filter(d => d.category === 'legal_glossary');
    
    if (glossaryDocs.length > 0) {
      console.log(`[AgentKnowledge] Legal glossary already exists with ${glossaryDocs.length} entries, skipping...`);
      return;
    }

    const legalTerms = [
      { term: 'Partner', translations: { es: 'Socio', de: 'Partner', zh: '合伙人', ko: '파트너', ja: 'パートナー', ar: 'شريك', ru: 'Партнер', fr: 'Associé', it: 'Socio' } },
      { term: 'Associate', translations: { es: 'Asociado', de: 'Associate', zh: '律师', ko: '변호사', ja: 'アソシエイト', ar: 'محامٍ', ru: 'Юрист', fr: 'Collaborateur', it: 'Associato' } },
      { term: 'Of Counsel', translations: { es: 'Of Counsel', de: 'Of Counsel', zh: '顾问律师', ko: '고문변호사', ja: 'オブカウンセル', ar: 'مستشار قانوني', ru: 'Советник', fr: 'Of Counsel', it: 'Of Counsel' } },
      { term: 'Corporate M&A', translations: { es: 'Fusiones y Adquisiciones', de: 'Unternehmenstransaktionen', zh: '企业并购', ko: '기업 인수합병', ja: '企業M&A', ar: 'الاندماج والاستحواذ', ru: 'Слияния и поглощения', fr: 'Fusions-Acquisitions', it: 'Fusioni e Acquisizioni' } },
      { term: 'Tax', translations: { es: 'Fiscal', de: 'Steuerrecht', zh: '税务', ko: '조세', ja: '税務', ar: 'الضرائب', ru: 'Налоговое право', fr: 'Fiscal', it: 'Fiscale' } },
      { term: 'Labor & Employment', translations: { es: 'Laboral', de: 'Arbeitsrecht', zh: '劳动法', ko: '노동법', ja: '労働法', ar: 'قانون العمل', ru: 'Трудовое право', fr: 'Droit du travail', it: 'Diritto del lavoro' } },
      { term: 'Litigation', translations: { es: 'Litigio', de: 'Prozessführung', zh: '诉讼', ko: '소송', ja: '訴訟', ar: 'التقاضي', ru: 'Судебные споры', fr: 'Contentieux', it: 'Contenzioso' } },
      { term: 'Compliance', translations: { es: 'Cumplimiento', de: 'Compliance', zh: '合规', ko: '컴플라이언스', ja: 'コンプライアンス', ar: 'الامتثال', ru: 'Комплаенс', fr: 'Conformité', it: 'Compliance' } },
      { term: 'Energy', translations: { es: 'Energía', de: 'Energierecht', zh: '能源', ko: '에너지', ja: 'エネルギー', ar: 'الطاقة', ru: 'Энергетика', fr: 'Énergie', it: 'Energia' } },
      { term: 'Real Estate', translations: { es: 'Inmobiliario', de: 'Immobilienrecht', zh: '房地产', ko: '부동산', ja: '不動産', ar: 'العقارات', ru: 'Недвижимость', fr: 'Immobilier', it: 'Immobiliare' } },
      { term: 'Antitrust', translations: { es: 'Competencia Económica', de: 'Kartellrecht', zh: '反垄断', ko: '공정거래', ja: '独占禁止法', ar: 'مكافحة الاحتكار', ru: 'Антимонопольное право', fr: 'Concurrence', it: 'Antitrust' } },
      { term: 'Data Protection', translations: { es: 'Protección de Datos', de: 'Datenschutz', zh: '数据保护', ko: '데이터 보호', ja: 'データ保護', ar: 'حماية البيانات', ru: 'Защита данных', fr: 'Protection des données', it: 'Protezione dei dati' } },
    ];

    for (const entry of legalTerms) {
      await this.addDocument({
        agentType: 'polyglot_translator',
        category: 'legal_glossary',
        title: entry.term,
        content: JSON.stringify(entry.translations),
        metadata: { type: 'glossary_entry', term: entry.term },
      });
    }

    console.log(`[AgentKnowledge] Added ${legalTerms.length} legal glossary entries to database`);
  }

  async toJSON(): Promise<{ documents: KnowledgeDocument[] }> {
    const allDocs = await dbPersistence.getAllKnowledge();
    return {
      documents: allDocs.map(doc => ({
        id: doc.id,
        agentType: doc.agentType as AgentType,
        category: doc.category,
        title: doc.title,
        content: doc.content,
        metadata: doc.metadata as Record<string, unknown>,
        usageCount: doc.usageCount || 0,
        createdAt: doc.createdAt || new Date(),
        updatedAt: doc.updatedAt || new Date(),
      })),
    };
  }

  /** Rehidrata documentos desde un backup (p.ej. pCloud) hacia la base.
   *  Best-effort por documento: un fallo individual no aborta la restauración. */
  async fromJSON(data: { documents?: KnowledgeDocument[] }): Promise<void> {
    if (!Array.isArray(data?.documents)) return;
    for (const doc of data.documents) {
      try {
        await this.addDocument({
          agentType: doc.agentType,
          category: doc.category,
          title: doc.title,
          content: doc.content,
          metadata: doc.metadata,
        });
      } catch (err) {
        console.error('[AgentKnowledge] fromJSON: failed to restore a document:', err);
      }
    }
  }
}

export const knowledgeStore = new AgentKnowledgeStore();
