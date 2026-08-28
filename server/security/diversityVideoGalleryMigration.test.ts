import assert from "node:assert/strict";
import test from "node:test";

const migration = await import("../../migrations/20260828_0003_restore_diversity_video_gallery.mjs");

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
