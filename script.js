/* =========================================================
   Portfolio d’Aurélie Sitja — données et interactions
   Les chemins correspondent à l’arborescence du dépôt GitHub.
   ========================================================= */
(() => {
  "use strict";

  const PATHS = {
    cv: "documents/autres/CV_AurélieSitja.pdf",
    reports: "documents/rapports/",
    images: "documents/images/"
  };

  // Les textes restent regroupés ici pour faciliter les mises à jour.
  const EXPERIENCES = {
    appl1: {
      kicker: "PROJET · LICENCE 1",
      title: "APP L1 — Projet scientifique",
      subtitle: "Montage et mesures de PACM",
      paragraphs: [
        "Ce projet de première année s’est appuyé sur une démarche expérimentale : préparation du montage, réalisation de mesures et observation du fonctionnement de plusieurs PACM.",
        "Les photographies documentent les différentes étapes du travail. L’acronyme « PACM » est conservé tel quel afin de ne pas lui attribuer une signification non vérifiée."
      ],
      report: "rapportAPPL1.pdf",
      reportLabel: "Consulter le rapport APP L1",
      images: [
        ...[1, 2, 3].map(n => ({ file: `APPL1_${n}.jpg`, caption: "Montage des PACM" })),
        ...[4, 5].map(n => ({ file: `APPL1_${n}.jpg`, caption: "Mesures des PACM" })),
        { file: "APPL1_6.jpg", caption: "Trois PACM en série" }
      ]
    },
    stageL1: {
      kicker: "STAGE · LICENCE 1",
      title: "Médiation scientifique en milieu naturel",
      subtitle: "Parcours-jeu autour des arbres · secteur d’Orsay",
      paragraphs: [
        "Au cours d’un stage de deux semaines réalisé en groupe de cinq, j’ai participé à la conception d’un parcours de découverte destiné aux enfants de 5 à 8 ans, dans un environnement de jardin botanique et de forêt du secteur d’Orsay.",
        "Le projet associait vulgarisation scientifique et activité ludique : préparation d’une brochure de questions-réponses, identification d’arbres et création de panneaux présentant des informations et éléments d’histoire. Les visuels montrent les supports préparés puis leur installation sur le terrain."
      ],
      report: "renduStageL1.pdf",
      reportLabel: "Consulter le rendu du stage L1",
      images: [
        ...[1, 2, 3, 4].map(n => ({ file: `brochure${n}.jpg`, caption: "Brochure du parcours-jeu" })),
        ...[1, 2].map(n => ({ file: `presentation${n}.jpg`, caption: "Support de présentation" })),
        ...[1, 2, 3].map(n => ({ file: `constructionPanneau${n}.jpg`, caption: "Construction des panneaux" })),
        ...[4, 5, 6].map(n => ({ file: `constructionPanneau${n}.jpg`, caption: "Panneaux installés sur le parcours" }))
      ]
    },
    appl2: {
      kicker: "PROJET · LICENCE 2",
      title: "APP L2 — Photobioréacteur",
      subtitle: "Projet autour de microalgues Chlorella",
      paragraphs: [
        "Ce projet portait sur un photobioréacteur et l’étude de microalgues du genre Chlorella, avec l’idée d’explorer leur intégration dans un espace vert.",
        "Le rapport associé constitue la référence pour les choix de conception, la démarche suivie et les résultats du projet. Cette présentation reste volontairement générale afin de ne pas attribuer au projet des résultats qui ne seraient pas vérifiés."
      ],
      report: "rapportAPPL2.pdf",
      reportLabel: "Consulter le rapport APP L2",
      images: []
    },
    stageL2: {
      kicker: "STAGE · LICENCE 2 · TÉLÉCOM PARIS",
      title: "Modélisation d’une antenne UWB",
      subtitle: "Antenne quasi-spirale à polarisation circulaire · bande cible 3–4 GHz",
      paragraphs: [
        "Lors de mon stage à Télécom Paris, j’ai travaillé sur la modélisation d’une antenne quasi-spirale à polarisation circulaire, avec une bande de fréquence cible de 3 à 4 GHz.",
        "Le travail s’appuyait sur CST Studio Suite pour construire et simuler le modèle, étudier les paramètres électromagnétiques et comparer différentes versions de la géométrie. Des prototypes imprimés ont également été documentés dans le cadre de la validation expérimentale.",
        "La galerie présente les étapes de modélisation et les prototypes. Les légendes sont volontairement prudentes ; elles peuvent être affinées après vérification des visuels exacts."
      ],
      report: "rapportStageL2.pdf",
      reportLabel: "Consulter le rapport de stage L2",
      images: [
        { file: "antenne1.jpg", caption: "Modèle initial de l’antenne" },
        { file: "antenne2.jpg", caption: "Modèle simulé sous CST Studio Suite" },
        { file: "antenne3.jpg", caption: "Version modifiée pour la bande de fréquence cible" },
        { file: "antenne4.jpg", caption: "Prototype imprimé de l’antenne spirale" },
        { file: "antenne5.jpg", caption: "Autre vue du prototype imprimé" }
      ]
    },
    stageL3: {
      kicker: "STAGE · LICENCE 3 · INSTITUT DE MATHÉMATIQUES D’ORSAY",
      title: "Étude de générateurs pseudo-aléatoires",
      subtitle: "Programmation Python · analyse statistique · recherche scientifique",
      paragraphs: [
        "Au cours d’un stage de huit semaines à l’Institut de Mathématiques d’Orsay, j’ai étudié les générateurs de nombres pseudo-aléatoires (PRNG), leur fonctionnement et certaines de leurs propriétés statistiques.",
        "Le travail a notamment abordé les notions de graine, de période, d’équirépartition, de corrélations et plusieurs familles de générateurs, dont les générateurs congruentiels linéaires. J’ai utilisé Python pour construire des outils d’étude et expérimenter autour des suites produites.",
        "Le rapport disponible est utilisé comme document de référence. Certaines parties de ce PDF semblent encore contenir des éléments provisoires ; il est donc conseillé de vérifier sa version publique avant diffusion."
      ],
      report: "rapportStageL3.pdf",
      reportLabel: "Consulter le rapport de stage L3",
      images: []
    }
  };

  const modalIds = ["experience-modal", "pdf-modal", "image-modal", "game-modal"];
  const modals = modalIds.map(id => document.getElementById(id));
  let lastFocusedElement = null;
  let activeImages = [];
  let activeImageIndex = 0;
  let currentPdfUrl = "";
  let pdfFallbackTimer = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function setModalOpen(modal, open) {
    if (!modal) return;
    if (open) {
      lastFocusedElement = document.activeElement;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      const focusTarget = $("button:not([disabled]), a[href], iframe", modal);
      if (focusTarget) window.setTimeout(() => focusTarget.focus({ preventScroll: true }), 0);
    } else {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      const remainingOpen = modals.some(item => item !== modal && item.classList.contains("is-open"));
      if (!remainingOpen) document.body.classList.remove("modal-open");
      if (modal.id === "pdf-modal") {
        const frame = $("#pdf-frame");
        if (frame) frame.src = "about:blank";
        clearTimeout(pdfFallbackTimer);
      }
      if (modal.id === "game-modal") {
        const frame = $("#game-frame");
        if (frame) frame.src = "about:blank";
        $("#game-modal .modal-dialog")?.classList.remove("is-expanded");
        $("#game-expand").textContent = "Agrandir ⤢";
      }
      if (modal.id === "image-modal") {
        $("#lightbox-image").src = "";
      }
      if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus({ preventScroll: true });
      }
    }
  }

  function closeTopModal() {
    for (let i = modals.length - 1; i >= 0; i--) {
      if (modals[i].classList.contains("is-open")) {
        setModalOpen(modals[i], false);
        return;
      }
    }
  }

  function openPdf(title, relativePath) {
    const url = relativePath;
    $("#pdf-title").textContent = title;
    $("#pdf-open-new").href = url;
    $("#pdf-download").href = url;
    $("#pdf-download").setAttribute("download", relativePath.split("/").pop());
    $("#pdf-fallback-link").href = url;
    $("#pdf-fallback").hidden = true;
    $("#pdf-frame").src = `${url}#view=FitH`;
    clearTimeout(pdfFallbackTimer);
    // Le lien direct reste toujours accessible même si le navigateur bloque l’aperçu.
    pdfFallbackTimer = window.setTimeout(() => {
      $("#pdf-fallback").hidden = false;
    }, 3500);
    setModalOpen($("#pdf-modal"), true);
  }

  function buildExperienceModal(key) {
    const experience = EXPERIENCES[key];
    if (!experience) return;
    $("#modal-kicker").textContent = experience.kicker;
    $("#modal-title").textContent = experience.title;
    $("#modal-subtitle").textContent = experience.subtitle;
    const description = $("#modal-description");
    description.replaceChildren();
    experience.paragraphs.forEach(text => {
      const p = document.createElement("p");
      p.textContent = text;
      description.appendChild(p);
    });

    const gallery = $("#modal-gallery");
    gallery.replaceChildren();
    gallery.hidden = experience.images.length === 0;
    activeImages = experience.images.map(image => ({
      src: PATHS.images + image.file,
      caption: image.caption,
      file: image.file
    }));

    experience.images.forEach((image, index) => {
      const figureButton = document.createElement("button");
      figureButton.type = "button";
      figureButton.className = "gallery-item";
      figureButton.setAttribute("aria-label", `Agrandir : ${image.caption}`);
      figureButton.addEventListener("click", () => openLightbox(index));

      const img = document.createElement("img");
      img.src = PATHS.images + image.file;
      img.alt = image.caption;
      img.loading = "lazy";
      img.addEventListener("error", () => {
        img.remove();
        const missing = document.createElement("span");
        missing.className = "image-missing";
        missing.textContent = `Image indisponible : ${image.file}`;
        figureButton.prepend(missing);
        figureButton.disabled = true;
        figureButton.style.cursor = "default";
      }, { once: true });

      const caption = document.createElement("span");
      caption.className = "gallery-caption";
      caption.textContent = image.caption;
      figureButton.append(img, caption);
      gallery.appendChild(figureButton);
    });

    const actions = $("#modal-document-actions");
    actions.replaceChildren();
    const reportLink = document.createElement("button");
    reportLink.type = "button";
    reportLink.className = "document-button";
    reportLink.textContent = `▤ ${experience.reportLabel}`;
    reportLink.addEventListener("click", () => openPdf(experience.reportLabel, PATHS.reports + experience.report));
    actions.appendChild(reportLink);

    if (key === "stageL3") {
      const cardLink = document.createElement("button");
      cardLink.type = "button";
      cardLink.className = "document-button";
      cardLink.textContent = "♠ Découvrir le projet personnel « Tour de cartes »";
      cardLink.addEventListener("click", () => openGame("tourCartes"));
      actions.appendChild(cardLink);
    }
    setModalOpen($("#experience-modal"), true);
  }

  function openLightbox(index) {
    if (!activeImages.length) return;
    activeImageIndex = index;
    renderLightbox();
    setModalOpen($("#image-modal"), true);
  }

  function renderLightbox() {
    const image = activeImages[activeImageIndex];
    if (!image) return;
    const img = $("#lightbox-image");
    img.src = image.src;
    img.alt = image.caption;
    $("#lightbox-caption").textContent = image.caption;
    $("#lightbox-counter").textContent = `${activeImageIndex + 1} / ${activeImages.length}`;
    const showNavigation = activeImages.length > 1;
    $("[data-image-prev]").hidden = !showNavigation;
    $("[data-image-next]").hidden = !showNavigation;
  }

  function moveLightbox(direction) {
    if (activeImages.length < 2) return;
    activeImageIndex = (activeImageIndex + direction + activeImages.length) % activeImages.length;
    renderLightbox();
  }

  const GAMES = {
    blockus: { title: "Blockus", path: "projets/blockus/" },
    tourCartes: { title: "Tour de cartes", path: "projets/tourCartes/" }
  };

  function openGame(key) {
    const game = GAMES[key];
    if (!game) return;
    $("#game-title").textContent = game.title;
    $("#game-open-new").href = game.path;
    $("#game-frame").src = game.path;
    setModalOpen($("#game-modal"), true);
  }

  // Boutons et cartes d’expérience
  $$("[data-experience]").forEach(button => {
    button.addEventListener("click", () => buildExperienceModal(button.dataset.experience));
  });
  $$("[data-open-cv]").forEach(button => {
    button.addEventListener("click", () => openPdf("CV — Aurélie Sitja", PATHS.cv));
  });
  $$("[data-open-game]").forEach(button => {
    button.addEventListener("click", () => openGame(button.dataset.openGame));
  });
  $$("[data-close-modal]").forEach(button => {
    button.addEventListener("click", () => {
      const modal = button.closest(".modal");
      if (modal) setModalOpen(modal, false);
    });
  });
  $("[data-image-prev]").addEventListener("click", () => moveLightbox(-1));
  $("[data-image-next]").addEventListener("click", () => moveLightbox(1));
  $("#game-expand").addEventListener("click", () => {
    const dialog = $("#game-modal .modal-dialog");
    const expanded = dialog.classList.toggle("is-expanded");
    $("#game-expand").textContent = expanded ? "Réduire ⤡" : "Agrandir ⤢";
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeTopModal();
    if ($("#image-modal").classList.contains("is-open")) {
      if (event.key === "ArrowLeft") moveLightbox(-1);
      if (event.key === "ArrowRight") moveLightbox(1);
    }
  });

  // L’année est dynamique pour éviter une mise à jour manuelle du pied de page.
  $("#current-year").textContent = new Date().getFullYear();

  // Vérifie la disponibilité des PDF au moment de l’ouverture sans bloquer la page.
  $("#pdf-frame").addEventListener("load", () => {
    const frame = $("#pdf-frame");
    if (frame.src.endsWith("about:blank")) return;
    clearTimeout(pdfFallbackTimer);
    // Certains navigateurs affichent un PDF sans déclencher de signal exploitable :
    // le lien d’ouverture/téléchargement demeure affiché dans la barre d’outils.
    $("#pdf-fallback").hidden = true;
  });
})();
