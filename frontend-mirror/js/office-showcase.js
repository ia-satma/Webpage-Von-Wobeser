(function () {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback);
    else callback();
  }

  ready(function () {
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var hero = document.querySelector(".hero-container");
    if (hero) hero.style.backgroundImage = "url('" + (hero.getAttribute("data-office-banner") || "/img/Banner/03.jpg") + "')";

    if (window.AOS) {
      window.AOS.init({ duration: reduceMotion ? 0 : 1200, once: reduceMotion, mirror: !reduceMotion, disable: reduceMotion });
    }

    var scrollButton = document.getElementById("btnScroll");
    if (scrollButton) {
      scrollButton.setAttribute("role", "button");
      scrollButton.setAttribute("tabindex", "0");
      var goToContent = function () {
        var target = document.getElementById("seccion1");
        if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      };
      scrollButton.addEventListener("click", goToContent);
      scrollButton.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); goToContent(); }
      });
    }

    var changingTitle = document.getElementById("changingTitle");
    var statIndex = 0;
    var stats = [];
    if (changingTitle) {
      try { stats = JSON.parse(changingTitle.getAttribute("data-office-stats") || "[]"); } catch (_error) { stats = []; }
    }
    function renderStat(stat) {
      if (!changingTitle || !stat) return;
      changingTitle.replaceChildren();
      changingTitle.append(document.createTextNode(stat.value || ""));
      if (stat.label) {
        changingTitle.append(document.createElement("br"));
        var label = document.createElement("p");
        label.className = "titulo espacio_n";
        label.textContent = stat.label;
        changingTitle.append(label);
      }
      changingTitle.style.display = "block";
    }
    if (changingTitle && stats.length) {
      renderStat(stats[0]);
      if (!reduceMotion && stats.length > 1) {
        window.setInterval(function () {
          changingTitle.style.opacity = "0";
          window.setTimeout(function () {
            statIndex = (statIndex + 1) % stats.length;
            renderStat(stats[statIndex]);
            changingTitle.style.opacity = "1";
          }, 300);
        }, 5000);
      }
    }

    var mainVideo = document.getElementById("videoPrincipal");
    var thumbnails = Array.prototype.slice.call(document.querySelectorAll(".video-thumb"));
    thumbnails.forEach(function (thumbnail, index) {
      thumbnail.classList.toggle("active", index === 0);
      thumbnail.setAttribute("role", "button");
      thumbnail.setAttribute("tabindex", "0");
      var chooseVideo = function () {
        if (!mainVideo) return;
        thumbnails.forEach(function (item) { item.classList.remove("active"); });
        thumbnail.classList.add("active");
        var source = thumbnail.getAttribute("data-video");
        if (!source) return;
        mainVideo.pause();
        mainVideo.src = source;
        mainVideo.load();
        var play = mainVideo.play();
        if (play && typeof play.catch === "function") play.catch(function () {});
      };
      thumbnail.addEventListener("click", chooseVideo);
      thumbnail.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); chooseVideo(); }
      });
    });

    if (window.bootstrap) {
      var imageModalElement = document.getElementById("imageModal");
      var carouselElement = document.getElementById("imageCarousel");
      if (imageModalElement && carouselElement) {
        var modal = window.bootstrap.Modal.getOrCreateInstance(imageModalElement);
        var carousel = window.bootstrap.Carousel.getOrCreateInstance(carouselElement, { interval: false, wrap: true });
        Array.prototype.slice.call(document.querySelectorAll(".gallery-image")).forEach(function (image, index) {
          image.setAttribute("tabindex", "0");
          image.setAttribute("role", "button");
          var openImage = function () { carousel.to(index); modal.show(); };
          image.addEventListener("click", openImage);
          image.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openImage(); }
          });
        });
      }
    }
  });
})();
