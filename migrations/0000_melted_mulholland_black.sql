CREATE TABLE "admin_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"ip_address" text,
	"user_agent" text,
	CONSTRAINT "admin_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'editor' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"last_login" timestamp,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "admin_users_username_unique" UNIQUE("username"),
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "agent_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"agent_type" text NOT NULL,
	"event_type" text NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_evolution_proposals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_type" text NOT NULL,
	"proposal_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"rationale" text,
	"impact" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"proposed_changes" jsonb,
	"metrics_before" jsonb,
	"metrics_after" jsonb,
	"created_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"implemented_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "agent_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"payload" jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"parent_job_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "agent_knowledge" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_type" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_skills" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_type" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"expertise" integer DEFAULT 50,
	"usage_count" integer DEFAULT 0,
	"success_rate" integer DEFAULT 100,
	"learnings" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "alliances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_es" text,
	"type" text DEFAULT 'network' NOT NULL,
	"description" text,
	"description_es" text,
	"logo_url" text,
	"website_url" text,
	"country" text,
	"country_es" text,
	"member_since" integer,
	"is_featured" boolean DEFAULT false,
	"published" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "awards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_es" text NOT NULL,
	"organization" text NOT NULL,
	"organization_es" text,
	"year" integer NOT NULL,
	"category" text,
	"category_es" text,
	"description" text,
	"description_es" text,
	"logo_url" text,
	"certificate_url" text,
	"is_highlight" boolean DEFAULT false,
	"published" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"title_es" text,
	"subtitle" text,
	"subtitle_es" text,
	"image_url" text,
	"image_url_mobile" text,
	"link_url" text,
	"link_text" text,
	"link_text_es" text,
	"position" text DEFAULT 'hero' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"published" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blog_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_es" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"description_es" text,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "blog_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_post_tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"tag_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"title_es" text NOT NULL,
	"slug" text NOT NULL,
	"content" text,
	"content_es" text,
	"excerpt" text,
	"excerpt_es" text,
	"featured_image" text,
	"category_id" varchar,
	"author_id" varchar,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"meta_title" text,
	"meta_title_es" text,
	"meta_description" text,
	"meta_description_es" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_es" text,
	"slug" text NOT NULL,
	CONSTRAINT "blog_tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "client_practice_groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"practice_group_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company" text,
	"practice_area" text,
	"message" text NOT NULL,
	"ip_address" text,
	"submitted_at" timestamp DEFAULT now(),
	"read" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "content_analysis" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" varchar NOT NULL,
	"analysis_result" jsonb NOT NULL,
	"quality_score" integer DEFAULT 0,
	"issues_count" integer DEFAULT 0,
	"status" text DEFAULT 'completed',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "diversity_initiatives" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"title_es" text NOT NULL,
	"description" text NOT NULL,
	"description_es" text NOT NULL,
	"category" text,
	"category_es" text,
	"impact" text,
	"impact_es" text,
	"year" integer,
	"image_url" text,
	"is_featured" boolean DEFAULT false,
	"published" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"title_es" text NOT NULL,
	"description" text NOT NULL,
	"description_es" text NOT NULL,
	"date" timestamp NOT NULL,
	"end_date" timestamp,
	"location" text,
	"location_es" text,
	"image_url" text,
	"event_type" text DEFAULT 'conference',
	"event_type_es" text,
	"external_url" text,
	"is_highlight" boolean DEFAULT false,
	"published" boolean DEFAULT true,
	"order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"question_es" text NOT NULL,
	"answer" text NOT NULL,
	"answer_es" text NOT NULL,
	"category" text,
	"category_es" text,
	"published" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "industry_groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_es" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"description_es" text NOT NULL,
	"full_description" text,
	"full_description_es" text,
	"icon_name" text,
	"image_url" text,
	"order" integer DEFAULT 0,
	CONSTRAINT "industry_groups_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "job_openings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"title_es" text NOT NULL,
	"department" text,
	"department_es" text,
	"location" text,
	"location_es" text,
	"type" text DEFAULT 'full_time' NOT NULL,
	"level" text,
	"description" text NOT NULL,
	"description_es" text NOT NULL,
	"requirements" text,
	"requirements_es" text,
	"benefits" text,
	"benefits_es" text,
	"salary_range" text,
	"application_email" text,
	"application_url" text,
	"practice_group_id" varchar,
	"is_urgent" boolean DEFAULT false,
	"published" boolean DEFAULT true,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "legal_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"title_es" text NOT NULL,
	"content" text NOT NULL,
	"content_es" text NOT NULL,
	"version" text DEFAULT '1.0',
	"effective_date" timestamp DEFAULT now(),
	"published" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "media_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"path" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer,
	"width" integer,
	"height" integer,
	"alt" text,
	"alt_es" text,
	"uploaded_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"title_es" text NOT NULL,
	"excerpt" text NOT NULL,
	"excerpt_es" text NOT NULL,
	"content" text,
	"content_es" text,
	"slug" text NOT NULL,
	"image_url" text,
	"date" timestamp DEFAULT now(),
	"published" boolean DEFAULT true,
	"category" text DEFAULT 'press',
	"category_es" text DEFAULT 'Prensa',
	"author_id" varchar,
	"processing_status" text DEFAULT 'pending',
	"last_error" text,
	"last_processed_at" timestamp,
	"failed_step" text,
	"publish_at" timestamp,
	"council_verdict" jsonb,
	CONSTRAINT "news_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "news_team_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"news_id" varchar NOT NULL,
	"team_member_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_translations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"news_id" varchar NOT NULL,
	"language" varchar(5) NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text,
	"category" text,
	"seo_title" text,
	"seo_description" text,
	"seo_keywords" text[],
	"translated_at" timestamp DEFAULT now(),
	"translated_by" varchar DEFAULT 'ai'
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"company" text,
	"preferred_language" varchar(5) DEFAULT 'es',
	"practice_interests" text[],
	"is_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"subscribed_at" timestamp DEFAULT now(),
	"unsubscribed_at" timestamp,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "office_images" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" text NOT NULL,
	"alt" text NOT NULL,
	"alt_es" text NOT NULL,
	"order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "offices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_es" text NOT NULL,
	"city" text NOT NULL,
	"country" text NOT NULL,
	"country_es" text,
	"address" text NOT NULL,
	"address_es" text,
	"phone" text,
	"fax" text,
	"email" text,
	"latitude" text,
	"longitude" text,
	"timezone" text,
	"description" text,
	"description_es" text,
	"image_url" text,
	"is_headquarters" boolean DEFAULT false,
	"published" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "practice_groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_es" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"description_es" text NOT NULL,
	"full_description" text,
	"full_description_es" text,
	"icon_name" text,
	"image_url" text,
	"order" integer DEFAULT 0,
	CONSTRAINT "practice_groups_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pro_bono_projects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"title_es" text NOT NULL,
	"organization" text,
	"organization_es" text,
	"description" text NOT NULL,
	"description_es" text NOT NULL,
	"impact" text,
	"impact_es" text,
	"year" integer,
	"image_url" text,
	"category" text,
	"category_es" text,
	"is_featured" boolean DEFAULT false,
	"published" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rankings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_es" text NOT NULL,
	"publication" text NOT NULL,
	"publication_es" text,
	"year" integer NOT NULL,
	"category" text,
	"category_es" text,
	"ranking" text,
	"ranking_es" text,
	"description" text,
	"description_es" text,
	"logo_url" text,
	"external_url" text,
	"is_highlight" boolean DEFAULT false,
	"published" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "representative_clients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"industry" text,
	"industry_es" text,
	"description" text,
	"description_es" text,
	"logo_url" text,
	"website_url" text,
	"is_featured" boolean DEFAULT false,
	"published" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "representative_matters" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"title_es" text NOT NULL,
	"description" text NOT NULL,
	"description_es" text NOT NULL,
	"client" text,
	"client_es" text,
	"year" integer NOT NULL,
	"practice_area_slug" text NOT NULL,
	"industry_slug" text,
	"is_highlight" boolean DEFAULT false,
	"order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "site_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text,
	"value_es" text,
	"type" text DEFAULT 'text' NOT NULL,
	"category" text DEFAULT 'general',
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "site_config_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "specialized_desks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_es" text NOT NULL,
	"slug" text NOT NULL,
	"country" text,
	"country_es" text,
	"flag_emoji" text,
	"description" text NOT NULL,
	"description_es" text NOT NULL,
	"full_description" text,
	"full_description_es" text,
	"image_url" text,
	"contact_email" text,
	"published" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "specialized_desks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team_member_awards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_member_id" varchar NOT NULL,
	"award_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_member_desks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_member_id" varchar NOT NULL,
	"desk_id" varchar NOT NULL,
	"role" text
);
--> statement-breakpoint
CREATE TABLE "team_member_industry_groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_member_id" varchar NOT NULL,
	"industry_group_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_member_practice_groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_member_id" varchar NOT NULL,
	"practice_group_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_member_rankings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_member_id" varchar NOT NULL,
	"ranking_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"title_es" text NOT NULL,
	"role" text NOT NULL,
	"role_es" text NOT NULL,
	"bio" text,
	"bio_es" text,
	"email" text,
	"phone" text,
	"image_url" text,
	"linkedin_url" text,
	"is_partner" boolean DEFAULT false,
	"order" integer DEFAULT 0,
	"education" jsonb,
	"bar_admissions" jsonb,
	"languages" jsonb,
	"affiliations" jsonb,
	"rankings" jsonb,
	"publications" jsonb,
	"representative_matters" jsonb,
	"experience" jsonb,
	CONSTRAINT "team_members_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote" text NOT NULL,
	"quote_es" text NOT NULL,
	"author_name" text NOT NULL,
	"author_title" text,
	"author_title_es" text,
	"author_company" text,
	"author_photo_url" text,
	"source" text,
	"source_es" text,
	"year" integer,
	"practice_group_id" varchar,
	"is_featured" boolean DEFAULT false,
	"published" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "translation_cache" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type" text NOT NULL,
	"entity_id" varchar NOT NULL,
	"field" text,
	"source_language" text DEFAULT 'en',
	"target_language" text NOT NULL,
	"source_text" text,
	"translated_text" text,
	"translations" jsonb,
	"is_approved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "website_audit_findings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" varchar NOT NULL,
	"category" text NOT NULL,
	"issue_type" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"entity_type" text,
	"entity_id" varchar,
	"language" varchar(5),
	"url" text,
	"details" jsonb NOT NULL,
	"recommendation" text,
	"owner_agent" text,
	"reported_at" timestamp DEFAULT now(),
	"resolved_at" timestamp,
	"resolved_by" text,
	"remediation_job_id" varchar
);
--> statement-breakpoint
CREATE TABLE "website_audits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_type" text DEFAULT 'full' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"pages_scanned" integer DEFAULT 0,
	"links_checked" integer DEFAULT 0,
	"translations_checked" integer DEFAULT 0,
	"issues_found" integer DEFAULT 0,
	"critical_count" integer DEFAULT 0,
	"high_count" integer DEFAULT 0,
	"medium_count" integer DEFAULT 0,
	"low_count" integer DEFAULT 0,
	"metrics" jsonb,
	"triggered_by" text DEFAULT 'manual'
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_events" ADD CONSTRAINT "agent_events_job_id_agent_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."agent_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_jobs" ADD CONSTRAINT "agent_jobs_parent_job_id_agent_jobs_id_fk" FOREIGN KEY ("parent_job_id") REFERENCES "public"."agent_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_tag_id_blog_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."blog_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_admin_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_practice_groups" ADD CONSTRAINT "client_practice_groups_client_id_representative_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."representative_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_practice_groups" ADD CONSTRAINT "client_practice_groups_practice_group_id_practice_groups_id_fk" FOREIGN KEY ("practice_group_id") REFERENCES "public"."practice_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_analysis" ADD CONSTRAINT "content_analysis_article_id_news_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_openings" ADD CONSTRAINT "job_openings_practice_group_id_practice_groups_id_fk" FOREIGN KEY ("practice_group_id") REFERENCES "public"."practice_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_author_id_admin_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_team_members" ADD CONSTRAINT "news_team_members_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_team_members" ADD CONSTRAINT "news_team_members_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_translations" ADD CONSTRAINT "news_translations_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_awards" ADD CONSTRAINT "team_member_awards_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_awards" ADD CONSTRAINT "team_member_awards_award_id_awards_id_fk" FOREIGN KEY ("award_id") REFERENCES "public"."awards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_desks" ADD CONSTRAINT "team_member_desks_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_desks" ADD CONSTRAINT "team_member_desks_desk_id_specialized_desks_id_fk" FOREIGN KEY ("desk_id") REFERENCES "public"."specialized_desks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_industry_groups" ADD CONSTRAINT "team_member_industry_groups_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_industry_groups" ADD CONSTRAINT "team_member_industry_groups_industry_group_id_industry_groups_id_fk" FOREIGN KEY ("industry_group_id") REFERENCES "public"."industry_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_practice_groups" ADD CONSTRAINT "team_member_practice_groups_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_practice_groups" ADD CONSTRAINT "team_member_practice_groups_practice_group_id_practice_groups_id_fk" FOREIGN KEY ("practice_group_id") REFERENCES "public"."practice_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_rankings" ADD CONSTRAINT "team_member_rankings_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_rankings" ADD CONSTRAINT "team_member_rankings_ranking_id_rankings_id_fk" FOREIGN KEY ("ranking_id") REFERENCES "public"."rankings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_practice_group_id_practice_groups_id_fk" FOREIGN KEY ("practice_group_id") REFERENCES "public"."practice_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_audit_findings" ADD CONSTRAINT "website_audit_findings_audit_id_website_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."website_audits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_sessions_user_idx" ON "admin_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agent_events_job_idx" ON "agent_events" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "agent_events_agent_type_idx" ON "agent_events" USING btree ("agent_type");--> statement-breakpoint
CREATE INDEX "agent_evolution_agent_type_idx" ON "agent_evolution_proposals" USING btree ("agent_type");--> statement-breakpoint
CREATE INDEX "agent_evolution_status_idx" ON "agent_evolution_proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_jobs_type_status_idx" ON "agent_jobs" USING btree ("agent_type","status");--> statement-breakpoint
CREATE INDEX "agent_jobs_parent_job_idx" ON "agent_jobs" USING btree ("parent_job_id");--> statement-breakpoint
CREATE INDEX "agent_knowledge_agent_type_idx" ON "agent_knowledge" USING btree ("agent_type");--> statement-breakpoint
CREATE INDEX "agent_skills_agent_type_idx" ON "agent_skills" USING btree ("agent_type");--> statement-breakpoint
CREATE INDEX "bpt_post_idx" ON "blog_post_tags" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "bpt_tag_idx" ON "blog_post_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "cpg_client_idx" ON "client_practice_groups" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "cpg_practice_group_idx" ON "client_practice_groups" USING btree ("practice_group_id");--> statement-breakpoint
CREATE INDEX "content_analysis_article_idx" ON "content_analysis" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "events_published_date_idx" ON "events" USING btree ("published","date");--> statement-breakpoint
CREATE INDEX "job_openings_practice_group_idx" ON "job_openings" USING btree ("practice_group_id");--> statement-breakpoint
CREATE INDEX "ntm_news_idx" ON "news_team_members" USING btree ("news_id");--> statement-breakpoint
CREATE INDEX "ntm_team_member_idx" ON "news_team_members" USING btree ("team_member_id");--> statement-breakpoint
CREATE INDEX "news_trans_news_lang_idx" ON "news_translations" USING btree ("news_id","language");--> statement-breakpoint
CREATE INDEX "rep_matters_practice_area_idx" ON "representative_matters" USING btree ("practice_area_slug");--> statement-breakpoint
CREATE INDEX "rep_matters_industry_idx" ON "representative_matters" USING btree ("industry_slug");--> statement-breakpoint
CREATE INDEX "tma_team_member_idx" ON "team_member_awards" USING btree ("team_member_id");--> statement-breakpoint
CREATE INDEX "tma_award_idx" ON "team_member_awards" USING btree ("award_id");--> statement-breakpoint
CREATE INDEX "tmd_team_member_idx" ON "team_member_desks" USING btree ("team_member_id");--> statement-breakpoint
CREATE INDEX "tmd_desk_idx" ON "team_member_desks" USING btree ("desk_id");--> statement-breakpoint
CREATE INDEX "tmig_team_member_idx" ON "team_member_industry_groups" USING btree ("team_member_id");--> statement-breakpoint
CREATE INDEX "tmig_industry_group_idx" ON "team_member_industry_groups" USING btree ("industry_group_id");--> statement-breakpoint
CREATE INDEX "tmpg_team_member_idx" ON "team_member_practice_groups" USING btree ("team_member_id");--> statement-breakpoint
CREATE INDEX "tmpg_practice_group_idx" ON "team_member_practice_groups" USING btree ("practice_group_id");--> statement-breakpoint
CREATE INDEX "tmr_team_member_idx" ON "team_member_rankings" USING btree ("team_member_id");--> statement-breakpoint
CREATE INDEX "tmr_ranking_idx" ON "team_member_rankings" USING btree ("ranking_id");--> statement-breakpoint
CREATE INDEX "testimonials_practice_group_idx" ON "testimonials" USING btree ("practice_group_id");--> statement-breakpoint
CREATE INDEX "findings_audit_idx" ON "website_audit_findings" USING btree ("audit_id");--> statement-breakpoint
CREATE INDEX "findings_entity_idx" ON "website_audit_findings" USING btree ("entity_type","entity_id");