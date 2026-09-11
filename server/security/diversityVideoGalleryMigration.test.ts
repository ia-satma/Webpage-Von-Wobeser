import assert from "node:assert/strict";
import test from "node:test";

const migration = await import("../../migrations/20260828_0003_restore_diversity_video_gallery.mjs");
const removal = await import("../../migrations/20260910_0002_remove_new_offices_videos_from_diversity.mjs");
const recovery = await import("../../migrations/20260910_0003_restore_diversity_carousel.mjs");
const localization = await import("../../migrations/20260910_0004_localize_diversity_videos.mjs");

test("la migración restaura videos y fotogramas de Diversidad sin tocar ediciones distintas", async () => {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const client = {
    async query(sql: string, values: unknown[] = []) {
      calls.push({ sql, values });
      return { rowCount: 1, rows: [{ key: values[1], value: values[0], value_es: values[0] }] };
    },
  };

  await migration.default(client as any);

  assert.equal(calls.length, 15);
  assert.match(calls[0].sql, /value = ANY\(\$3::text\[\]\) OR value_es = ANY\(\$3::text\[\]\)/i);
  assert.deepEqual(calls[0].values, ["/img/videos/video1.mp4", "page_diversity_video_1", ["/images/vid_01.mp4"]]);
  assert.deepEqual(calls[6].values, ["", "page_diversity_video_7", ["/images/vid_07.mp4"]]);
  assert.deepEqual(calls[7].values, ["/images/diversity-thumbnails/main.jpg", "page_diversity_thumb_main", ["/images/thumb_main_vid.png"]]);
  assert.deepEqual(calls[14].values, ["", "page_diversity_thumb_7", ["/images/thumb_main_vid.png", "/images/thumb_07.jpg"]]);
});

test("la migración tolera una galería ya personalizada desde Administración", async () => {
  const client = { async query() { return { rowCount: 0, rows: [] }; } };
  await assert.doesNotReject(migration.default(client as any));
});

test("la corrección retira sólo los seis videos y miniaturas heredados de Nuevas oficinas", async () => {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const client = {
    async query(sql: string, values: unknown[] = []) {
      calls.push({ sql, values });
      return { rowCount: 0, rows: [] };
    },
  };

  await removal.default(client as any);

  assert.equal(calls.length, 12);
  assert.match(calls[0].sql, /value = \$2/i);
  assert.match(calls[0].sql, /COALESCE\(value_es, ''\) IN \('', \$2\)/i);
  assert.deepEqual(calls[0].values, ["page_diversity_video_1", "/img/videos/video1.mp4"]);
  assert.deepEqual(calls[5].values, ["page_diversity_video_6", "/img/videos/video6.mp4"]);
  assert.deepEqual(calls[6].values, ["page_diversity_thumb_1", "/images/diversity-thumbnails/video-1.jpg"]);
  assert.deepEqual(calls[11].values, ["page_diversity_thumb_6", "/images/diversity-thumbnails/video-6.jpg"]);
});

test("la recuperación restablece el carrusel de Diversidad sin cambiar contenido personalizado", async () => {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const client = {
    async query(sql: string, values: unknown[] = []) {
      calls.push({ sql, values });
      return { rowCount: 1, rows: [{ key: values[1], value: values[0], value_es: values[0] }] };
    },
  };

  await recovery.default(client as any);

  assert.equal(calls.length, 14);
  assert.match(calls[0].sql, /value = ANY\(\$3::text\[\]\)/i);
  assert.deepEqual(calls[0].values, [
    "https://vonwobeser.com/images/vid_01.mp4",
    "page_diversity_video_1",
    ["", "/images/vid_01.mp4", "/img/videos/video1.mp4"],
  ]);
  assert.deepEqual(calls[6].values, [
    "https://vonwobeser.com/images/vid_07.mp4",
    "page_diversity_video_7",
    ["", "/images/vid_07.mp4"],
  ]);
  assert.deepEqual(calls[7].values, [
    "/images/diversity-thumbnails/video-1.jpg",
    "page_diversity_thumb_1",
    [""],
  ]);
  assert.deepEqual(calls[13].values, [
    "/images/diversity-thumbnails/video-7.jpg",
    "page_diversity_thumb_7",
    [""],
  ]);
});

test("la localización sustituye sólo las siete URL externas heredadas", async () => {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const client = {
    async query(sql: string, values: unknown[] = []) {
      calls.push({ sql, values });
      return { rowCount: 1, rows: [{ key: values[1], value: values[0], value_es: values[0] }] };
    },
  };

  await localization.default(client as any);

  assert.equal(calls.length, 7);
  assert.match(calls[0].sql, /value = \$3/i);
  assert.deepEqual(calls[0].values, [
    "/images/vid_01.mp4",
    "page_diversity_video_1",
    "https://vonwobeser.com/images/vid_01.mp4",
  ]);
  assert.deepEqual(calls[6].values, [
    "/images/vid_07.mp4",
    "page_diversity_video_7",
    "https://vonwobeser.com/images/vid_07.mp4",
  ]);
});
