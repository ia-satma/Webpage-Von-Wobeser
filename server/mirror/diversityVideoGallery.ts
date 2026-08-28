import fs from "node:fs";
import * as cheerio from "cheerio";
import { buildVideoEmbedUrl, parseVideoSource } from "@shared/videoSource";
import { mirrorPath } from "./config";
import { cfg, type ConfigMap } from "./siteConfig";

type Lang = "en" | "es";

const DIVERSITY_SWAP_ORIGINAL = "salsa.setAttribute('src', '/images/' + cual + '.mp4');";
const DIVERSITY_SWAP_EDITABLE =
  "if(window.vwSelectDiversityVideo){window.vwSelectDiversityVideo(this);return;}salsa.setAttribute('src', $(this).attr('data-video') || ('/images/' + cual + '.mp4'));";

const diversityLocalFileExists = (relUrl: string): boolean => {
  if (!relUrl.startsWith("/images/")) return true;
  try {
    return fs.existsSync(mirrorPath(relUrl.slice(1)));
  } catch {
    return false;
  }
};

/**
 * Conecta los ocho videos administrables de Diversidad con un reproductor que
 * acepta archivos propios y enlaces normalizados de YouTube/Vimeo.
 */
export function applyDiversityVideoGallery($: cheerio.CheerioAPI, config: ConfigMap, lang: Lang): void {
  const v = (key: string, fallback: string) => (config[key]?.value || "").trim() || fallback;
  const localized = (key: string, fallback: string) => cfg(config, key, lang).trim() || fallback;

  // La captura histórica usa un rótulo vertical en mayúsculas y convierte el
  // primer párrafo en el título visual. Reemplazamos solo esa cabecera por la
  // misma jerarquía editorial de Contacto/Prácticas, conservando el intro,
  // galería, logotipos y demás contenido administrable sin duplicarlo.
  const page = $(".page").first();
  const legacyTitle = page.find(".page__ttl").first();
  if (page.length && legacyTitle.length) {
    const eyebrow = localized("page_diversity_eyebrow", lang === "es" ? "Nuestra firma" : "Our firm");
    const title = localized("page_diversity_title", lang === "es" ? "Diversidad e inclusión" : "Diversity & inclusion");
    const heading = $("<header>")
      .addClass("vw-diversity-page__header")
      .append($("<p>").addClass("vw-diversity-page__eyebrow").text(eyebrow))
      .append($("<h1>").addClass("vw-diversity-page__title").attr("id", "vw-diversity-page-title").text(title));
    page.addClass("vw-diversity-page").attr("aria-labelledby", "vw-diversity-page-title");
    legacyTitle.replaceWith(heading);
  }

  const mainUrl = v("page_diversity_video_main", "/images/vw_vid_02.mp4");
  const resolve = (url: string): string | null => (url && diversityLocalFileExists(url) ? url : null);
  // El espejo conserva siete videos reales: el principal y seis entrevistas.
  // Nunca repetimos el principal para llenar una miniatura cuyo archivo ya no
  // existe; una octava posición sólo se muestra si Administración aporta video.
  const slots: Record<string, string | null> = {
    vw_vid_02: mainUrl,
    vid_01: resolve(v("page_diversity_video_1", "/img/videos/video1.mp4")),
    vid_02: resolve(v("page_diversity_video_2", "/img/videos/video2.mp4")),
    vid_03: resolve(v("page_diversity_video_3", "/img/videos/video3.mp4")),
    vid_04: resolve(v("page_diversity_video_4", "/img/videos/video4.mp4")),
    vid_05: resolve(v("page_diversity_video_5", "/img/videos/video5.mp4")),
    vid_06: resolve(v("page_diversity_video_6", "/img/videos/video6.mp4")),
    vid_07: resolve((config.page_diversity_video_7?.value || "").trim()),
  };
  const thumbKeys: Record<string, string> = {
    vw_vid_02: "page_diversity_thumb_main",
    vid_01: "page_diversity_thumb_1",
    vid_02: "page_diversity_thumb_2",
    vid_03: "page_diversity_thumb_3",
    vid_04: "page_diversity_thumb_4",
    vid_05: "page_diversity_thumb_5",
    vid_06: "page_diversity_thumb_6",
    vid_07: "page_diversity_thumb_7",
  };
  const thumbFallbacks: Record<string, string> = {
    vw_vid_02: "/images/diversity-thumbnails/main.jpg",
    vid_01: "/images/diversity-thumbnails/video-1.jpg",
    vid_02: "/images/diversity-thumbnails/video-2.jpg",
    vid_03: "/images/diversity-thumbnails/video-3.jpg",
    vid_04: "/images/diversity-thumbnails/video-4.jpg",
    vid_05: "/images/diversity-thumbnails/video-5.jpg",
    vid_06: "/images/diversity-thumbnails/video-6.jpg",
    // El séptimo video es opcional: si se habilita sin subir aún su imagen,
    // mostramos un respaldo válido en lugar de una miniatura rota.
    vid_07: "/images/diversity-thumbnails/main.jpg",
  };
  const mainSource = parseVideoSource(mainUrl) || parseVideoSource("/images/vw_vid_02.mp4")!;
  const mainEmbed = buildVideoEmbedUrl(mainSource, { autoplay: false, controls: true });
  const player = $("#videoPlayer");
  const source = $("#videoSource");
  const frame = $("<iframe>").attr({
    id: "vwDiversityEmbed",
    title: lang === "es" ? "Video de Diversidad e Inclusión" : "Diversity and Inclusion video",
    allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
    referrerpolicy: "strict-origin-when-cross-origin",
    sandbox: "allow-scripts allow-same-origin allow-presentation",
    allowfullscreen: "",
    loading: "lazy",
  });
  frame.css({ width: "100%", aspectRatio: "16 / 9", border: "0" });
  player.closest(".slide_vid").append(frame);
  if (mainEmbed) {
    source.removeAttr("src");
    player.attr("hidden", "");
    frame.attr("src", mainEmbed);
  } else {
    source.attr("src", mainSource.kind === "file" ? mainSource.url : "/images/vw_vid_02.mp4");
    frame.attr("hidden", "");
  }

  $(".thumb[name]").each((_index, el) => {
    const name = $(el).attr("name") || "";
    const selectedUrl = slots[name];
    if (!selectedUrl) {
      $(el).remove();
      return;
    }
    const slotSource = parseVideoSource(selectedUrl) || mainSource;
    $(el).removeAttr("data-video").removeAttr("data-embed");
    if (slotSource.kind === "file") {
      $(el).attr("data-video", slotSource.url);
    } else {
      $(el).attr("data-embed", buildVideoEmbedUrl(slotSource, { autoplay: true, controls: true }) || "");
    }
    const thumbKey = thumbKeys[name];
    const thumb = v(thumbKey, thumbFallbacks[name] || thumbFallbacks.vw_vid_02);
    $(el).find("img").first().attr({ src: thumb, alt: lang === "es" ? "Vista previa del video" : "Video preview" });
  });

  const partnerLogos = ["page_diversity_logo_1", "page_diversity_logo_2", "page_diversity_logo_3"];
  $(".page__content--body .pro_img img").each((index, el) => {
    if (partnerLogos[index]) $(el).attr({
      src: v(partnerLogos[index], $(el).attr("src") || ""),
      alt: `Diversity partner ${index + 1}`,
    });
  });
  // Escritorio conserva los mismos tres aliados en la columna lateral. La
  // captura tenía archivos y posiciones independientes para esa variante;
  // al reutilizar esta fuente única, una edición desde Administración se
  // refleja igual en escritorio y móvil.
  $(".page__sidebar > img.img_probono_1, .page__sidebar > img.img_probono_2, .page__sidebar > img.img_probono_3, .page__sidebar > img.img_probono_4").each((index, el) => {
    if (partnerLogos[index]) $(el).attr({
      src: v(partnerLogos[index], $(el).attr("src") || ""),
      alt: `Diversity partner ${index + 1}`,
    });
  });
  $("script").each((_, el) => {
    const js = $(el).html();
    if (js && js.includes(DIVERSITY_SWAP_ORIGINAL)) {
      $(el).text(js.replace(DIVERSITY_SWAP_ORIGINAL, DIVERSITY_SWAP_EDITABLE));
    }
  });
  $("body").append(`<script id="vw-diversity-video-player">(function(){
    window.vwSelectDiversityVideo=function(item){
      var video=document.getElementById('videoPlayer');
      var source=document.getElementById('videoSource');
      var frame=document.getElementById('vwDiversityEmbed');
      if(!video||!source||!frame||!item)return;
      var embed=item.getAttribute('data-embed')||'';
      var file=item.getAttribute('data-video')||'';
      try{video.pause();}catch(_error){}
      if(embed){
        source.removeAttribute('src');video.hidden=true;frame.hidden=false;frame.src=embed;
      }else if(file){
        frame.src='about:blank';frame.hidden=true;video.hidden=false;source.src=file;video.load();
        var promise=video.play();if(promise&&promise.catch)promise.catch(function(){});
      }
    };
  })();</script>`);
}
