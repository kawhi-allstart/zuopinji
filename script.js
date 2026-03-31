const siteContent = window.siteContent;
const portfolioData = window.portfolioData;

const qs = (selector) => document.querySelector(selector);
const toAssetUrl = (path) => path.split("/").map(encodeURIComponent).join("/");
const lightboxState = {
  projectIndex: 0,
  imageIndex: 0,
  entries: [],
};

const CATEGORY_ORDER = [
  "21年至今我管理的项目",
  "19-20年我参与的项目",
  "我的作品",
];

const GENERIC_LABELS = new Set(["效果图", "真实照片", "视频", "方案文件"]);
const MEDIA_META = {
  rendering: {
    label: "效果图",
    groupLabel: "效果图",
    coverHint: "下方单独查看效果图与实景",
  },
  photo: {
    label: "实景",
    groupLabel: "实景",
    coverHint: "下方单独查看实景资料",
  },
  video: {
    label: "视频",
    groupLabel: "视频",
    coverHint: "点击查看视频内容",
  },
  asset: {
    label: "资料",
    groupLabel: "资料",
    coverHint: "点击查看全部资料",
  },
};

function getCategoryContent(name) {
  return siteContent.categories[name] || {
    displayTitle: name,
    shortLabel: name,
    description: "项目资料已归档到当前板块。"
  };
}

function makeSectionId(categoryName) {
  if (categoryName === "21年至今我管理的项目") {
    return "category-managed";
  }
  if (categoryName === "19-20年我参与的项目") {
    return "category-participated";
  }
  if (categoryName === "我的作品") {
    return "category-personal";
  }
  return `category-${categoryName}`;
}

function createPill(text) {
  const span = document.createElement("span");
  span.className = "pill";
  span.textContent = text;
  return span;
}

function createFallback(title, detail, className = "media-fallback") {
  const node = document.createElement("div");
  node.className = className;
  node.innerHTML = `<span>${title}</span><small>${detail}</small>`;
  return node;
}

function buildDocLink(doc) {
  const link = document.createElement("a");
  link.className = "doc-link";
  link.href = toAssetUrl(doc.path);
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = `${doc.extension.toUpperCase()} · ${doc.name}`;
  return link;
}

function createVideoElement(path, className, options = {}) {
  const video = document.createElement("video");
  video.className = className;
  video.src = toAssetUrl(path);
  video.preload = options.preload || "metadata";
  video.playsInline = true;
  video.setAttribute("playsinline", "");

  if (options.muted) {
    video.muted = true;
    video.defaultMuted = true;
  }
  if (options.loop) {
    video.loop = true;
  }
  if (options.autoplay) {
    video.autoplay = true;
  }
  if (options.controls) {
    video.controls = true;
  }

  return video;
}

function getDisplayLabels(project) {
  const filtered = project.labels.filter((label) => !GENERIC_LABELS.has(label));
  return filtered;
}

function getMediaTypeFromPath(project, path) {
  if (project.renderings.includes(path)) {
    return "rendering";
  }
  if (project.photos.includes(path)) {
    return "photo";
  }
  if ((project.videos || []).some((video) => video.path === path)) {
    return "video";
  }
  return "asset";
}

function getProjectGalleryEntries(project) {
  const imageSource = project.showcaseImages.length > 0
    ? project.showcaseImages
    : [...project.renderings, ...project.photos];
  const source = [...imageSource, ...(project.videos || []).map((video) => video.path)];

  return source.map((path, index) => {
    const type = getMediaTypeFromPath(project, path);
    return {
      index,
      path,
      type,
      label: MEDIA_META[type].label,
    };
  });
}

function getGalleryGroups(project, entries = getProjectGalleryEntries(project)) {
  const renderingItems = entries.filter((entry) => entry.type === "rendering");
  const photoItems = entries.filter((entry) => entry.type === "photo");
  const videoItems = entries.filter((entry) => entry.type === "video");
  const assetItems = entries.filter((entry) => entry.type === "asset");
  const groups = [];

  if (renderingItems.length > 0) {
    groups.push({
      type: "rendering",
      label: MEDIA_META.rendering.groupLabel,
      total: project.counts.renderings || renderingItems.length,
      items: renderingItems,
    });
  }

  if (photoItems.length > 0) {
    groups.push({
      type: "photo",
      label: MEDIA_META.photo.groupLabel,
      total: project.counts.photos || photoItems.length,
      items: photoItems,
    });
  }

  if (videoItems.length > 0) {
    groups.push({
      type: "video",
      label: MEDIA_META.video.groupLabel,
      total: project.counts.videos || videoItems.length,
      items: videoItems,
    });
  }

  if (assetItems.length > 0) {
    groups.push({
      type: "asset",
      label: MEDIA_META.asset.groupLabel,
      total: assetItems.length,
      items: assetItems,
    });
  }

  return groups;
}

function getMediaPreviewPath(project, type) {
  const fromShowcase = project.showcaseImages.find((path) => getMediaTypeFromPath(project, path) === type);
  if (fromShowcase) {
    return fromShowcase;
  }
  if (type === "rendering") {
    return project.renderings[0];
  }
  if (type === "photo") {
    return project.photos[0];
  }
  if (type === "video") {
    return project.videos?.[0]?.path || null;
  }
  return null;
}

function getMediaCardCount(project, type) {
  if (type === "rendering") {
    return project.counts.renderings;
  }
  if (type === "photo") {
    return project.counts.photos;
  }
  if (type === "video") {
    return project.counts.videos;
  }
  return 0;
}

function getFirstGalleryIndex(project, type) {
  return getProjectGalleryEntries(project).findIndex((entry) => entry.type === type);
}

function getProjectCoverLabel(project) {
  if (project.renderings.length > 0 && project.photos.length > 0) {
    return "效果图 / 实景";
  }
  if (project.renderings.length > 0) {
    return "效果图";
  }
  if (project.photos.length > 0) {
    return "实景";
  }
  if ((project.videos || []).length > 0) {
    return "视频";
  }
  return project.highlights[0] || "项目资料";
}

function getProjectCoverHint(project) {
  if (project.renderings.length > 0 && project.photos.length > 0) {
    return "点击封面或下方分区查看全部图片";
  }
  if (project.renderings.length > 0) {
    return "点击封面或下方查看全部效果图";
  }
  if (project.photos.length > 0) {
    return "点击封面或下方查看全部实景";
  }
  if ((project.videos || []).length > 0) {
    return "点击封面查看视频播放";
  }
  return MEDIA_META.asset.coverHint;
}

function formatProjectAssetCount(project) {
  const imageCount = project.showcaseImages.length;
  const videoCount = project.videos?.length || 0;
  if (imageCount > 0 && videoCount > 0) {
    return `共 ${imageCount} 张图片 / ${videoCount} 个视频`;
  }
  if (imageCount > 0) {
    return `共 ${imageCount} 张图片`;
  }
  if (videoCount > 0) {
    return `共 ${videoCount} 个视频`;
  }
  if (project.documents.length > 0) {
    return `共 ${project.documents.length} 项资料`;
  }
  return "资料已归档";
}

function getProjectFallbackDetail(project) {
  if (project.counts.videos > 0 && project.showcaseImages.length === 0) {
    return "视频演示";
  }
  if (project.documents.length > 0) {
    return "项目资料";
  }
  return "项目内容";
}

function createMediaPreviewCard(project, projectIndex, type) {
  const previewPath = getMediaPreviewPath(project, type);
  const openIndex = getFirstGalleryIndex(project, type);
  if (!previewPath || openIndex === -1) {
    return null;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = `project-media-card is-${type}`;
  const thumb = document.createElement("span");
  thumb.className = "project-media-thumb";
  if (type === "video") {
    thumb.appendChild(createVideoElement(previewPath, "project-media-video", { autoplay: true, muted: true, loop: true }));
  } else {
    const image = document.createElement("img");
    image.src = toAssetUrl(previewPath);
    image.alt = `${project.name} ${MEDIA_META[type].label}预览`;
    image.loading = "lazy";
    thumb.appendChild(image);
  }

  const copy = document.createElement("span");
  copy.className = "project-media-copy";
  copy.innerHTML = `
    <span class="project-media-title">${MEDIA_META[type].label}</span>
    <strong class="project-media-count">${getMediaCardCount(project, type)} ${type === "video" ? "个" : "张"}</strong>
    <span class="project-media-meta">查看${MEDIA_META[type].label}</span>
  `;

  button.append(thumb, copy);
  button.addEventListener("click", () => openLightbox(projectIndex, openIndex));
  return button;
}

function groupProjects(projects) {
  const map = new Map();

  projects.forEach((project, index) => {
    const key = project.category || "项目归档";
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push({ project, index });
  });

  return Array.from(map.entries())
    .sort((a, b) => {
      const orderA = CATEGORY_ORDER.indexOf(a[0]);
      const orderB = CATEGORY_ORDER.indexOf(b[0]);
      const safeA = orderA === -1 ? CATEGORY_ORDER.length : orderA;
      const safeB = orderB === -1 ? CATEGORY_ORDER.length : orderB;
      return safeA - safeB;
    })
    .map(([category, items]) => ({
      category,
      sectionId: makeSectionId(category),
      content: getCategoryContent(category),
      items,
    }));
}

function formatCategoryMeta(group) {
  return `${group.items.length} 个项目`;
}

function renderBrand() {
  qs("#brand-mark").textContent = siteContent.brand.mark;
  qs("#brand-title").textContent = siteContent.brand.title;
  qs("#brand-subtitle").textContent = siteContent.brand.subtitle;

  qs("#hero-eyebrow").textContent = siteContent.hero.eyebrow;
  qs("#hero-title").textContent = siteContent.hero.title;
  qs("#hero-summary").textContent = siteContent.hero.summary;
  qs("#hero-target").textContent = siteContent.hero.target;

  qs("#hero-primary").textContent = siteContent.hero.primaryCta.label;
  qs("#hero-primary").href = siteContent.hero.primaryCta.href;
  qs("#hero-secondary").textContent = siteContent.hero.secondaryCta.label;
  qs("#hero-secondary").href = siteContent.hero.secondaryCta.href;

  qs("#hero-board-tag").textContent = siteContent.heroBoard.tag;
  qs("#hero-board-title").textContent = siteContent.heroBoard.title;

  qs("#project-section-tag").textContent = siteContent.projectSection.tag;
  qs("#project-section-title").textContent = siteContent.projectSection.title;
  qs("#project-section-intro").textContent = siteContent.projectSection.intro;

  qs("#footer-text").textContent = siteContent.footer;
}

function renderStats() {
  const template = qs("#stat-template");
  const root = qs("#hero-stats");
  const groups = groupProjects(portfolioData.projects);
  const getGroupCount = (name) => groups.find((group) => group.category === name)?.items.length || 0;

  const stats = [
    { value: String(getGroupCount("21年至今我管理的项目")).padStart(2, "0"), label: "管理项目" },
    { value: String(getGroupCount("19-20年我参与的项目")).padStart(2, "0"), label: "参与项目" },
    { value: String(getGroupCount("我的作品")).padStart(2, "0"), label: "个人作品" },
    { value: String(portfolioData.overview.projectCount).padStart(2, "0"), label: "总项目" },
  ];

  stats.forEach((item) => {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector(".stat-value").textContent = item.value;
    fragment.querySelector(".stat-label").textContent = item.label;
    root.appendChild(fragment);
  });
}

function renderHeroCategories() {
  const template = qs("#category-card-template");
  const root = qs("#hero-category-grid");
  const groups = groupProjects(portfolioData.projects);

  groups.forEach((group) => {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector(".category-card");
    const media = fragment.querySelector(".category-card-media");
    const image = fragment.querySelector("img");
    const firstProject = group.items[0]?.project;
    const displayTitle = group.content.displayTitle || group.category;

    card.href = `#${group.sectionId}`;
    fragment.querySelector(".category-card-kicker").textContent = group.content.shortLabel;
    fragment.querySelector(".category-card-title").textContent = displayTitle;
    fragment.querySelector(".category-card-body").textContent = group.content.description;
    fragment.querySelector(".category-card-meta").textContent = formatCategoryMeta(group);

    if (firstProject?.cover) {
      image.src = toAssetUrl(firstProject.cover);
      image.alt = `${displayTitle} 封面图`;
    } else {
      image.remove();
      media.appendChild(createFallback(group.content.shortLabel, "资料归档", "category-fallback"));
    }

    root.appendChild(fragment);
  });
}

function renderCategoryLinks() {
  const root = qs("#category-links");

  groupProjects(portfolioData.projects).forEach((group) => {
    const link = document.createElement("a");
    link.className = "section-link";
    link.href = `#${group.sectionId}`;
    link.textContent = `${group.content.shortLabel} · ${group.items.length}`;
    root.appendChild(link);
  });
}

function renderProjects() {
  const template = qs("#project-template");
  const root = qs("#project-list");

  groupProjects(portfolioData.projects).forEach((group) => {
    const section = document.createElement("section");
    section.className = "category-section reveal";
    section.id = group.sectionId;

    const head = document.createElement("div");
    head.className = "category-section-head";

    const copy = document.createElement("div");
    copy.className = "category-section-copy";
    const displayTitle = group.content.displayTitle || group.category;

    const tag = document.createElement("p");
    tag.className = "section-tag";
    tag.textContent = group.content.shortLabel;

    const title = document.createElement("h3");
    title.className = "category-section-title";
    title.textContent = displayTitle;

    const body = document.createElement("p");
    body.className = "category-section-body";
    body.textContent = group.content.description;

    const meta = document.createElement("p");
    meta.className = "category-section-meta";
    meta.textContent = formatCategoryMeta(group);

    copy.append(tag, title, body);
    head.append(copy, meta);
    section.appendChild(head);

    const grid = document.createElement("div");
    grid.className = "category-project-grid";

    group.items.forEach(({ project, index }, itemIndex) => {
      const fragment = template.content.cloneNode(true);
      const card = fragment.querySelector(".project-card");
      const coverButton = fragment.querySelector(".project-cover");
      const coverImage = fragment.querySelector(".project-cover-image");
      const labelsRoot = fragment.querySelector(".project-labels");
      const docsRoot = fragment.querySelector(".project-docs");
      const mediaStrip = fragment.querySelector(".project-media-strip");

      fragment.querySelector(".project-cover-label").textContent = getProjectCoverLabel(project);
      fragment.querySelector(".project-cover-count").textContent = getProjectCoverHint(project);
      fragment.querySelector(".project-index").textContent = `${group.content.shortLabel} / ${String(itemIndex + 1).padStart(2, "0")}`;
      fragment.querySelector(".project-counts").textContent = formatProjectAssetCount(project);
      fragment.querySelector(".project-title").textContent = project.name;
      fragment.querySelector(".project-summary").textContent = project.summary;

      if (project.cover) {
        coverImage.src = toAssetUrl(project.cover);
        coverImage.alt = `${project.name} 封面图`;
      } else if ((project.videos || []).length > 0) {
        coverImage.remove();
        coverButton.classList.add("has-video");
        coverButton.prepend(createVideoElement(project.videos[0].path, "project-cover-video", {
          autoplay: true,
          muted: true,
          loop: true,
        }));
      } else {
        coverImage.remove();
        coverButton.classList.add("is-static");
        coverButton.prepend(createFallback(project.name, getProjectFallbackDetail(project), "project-cover-fallback"));
      }

      fragment.querySelector(".project-highlights").remove();
      ["rendering", "photo", "video"].forEach((type) => {
        const cardNode = createMediaPreviewCard(project, index, type);
        if (cardNode) {
          mediaStrip.appendChild(cardNode);
        }
      });
      if (!mediaStrip.children.length) {
        mediaStrip.remove();
      }
      getDisplayLabels(project).forEach((label) => labelsRoot.appendChild(createPill(label)));
      [...project.documents, ...(project.videos || [])].forEach((doc) => docsRoot.appendChild(buildDocLink(doc)));

      if (project.showcaseImages.length > 0 || (project.videos || []).length > 0) {
        coverButton.addEventListener("click", () => openLightbox(index, 0));
      } else {
        coverButton.disabled = true;
      }

      grid.appendChild(card);
    });

    section.appendChild(grid);
    root.appendChild(section);
  });
}

function openLightbox(projectIndex, imageIndex) {
  const dialog = qs("#gallery-dialog");
  const project = portfolioData.projects[projectIndex];
  const galleryEntries = getProjectGalleryEntries(project);

  if (galleryEntries.length === 0) {
    return;
  }

  lightboxState.projectIndex = projectIndex;
  lightboxState.entries = galleryEntries;
  lightboxState.imageIndex = Math.max(0, Math.min(imageIndex, galleryEntries.length - 1));

  qs("#dialog-title").textContent = project.name;
  qs("#dialog-summary").textContent = project.summary;

  const categoryLabel = getCategoryContent(project.category).shortLabel;
  qs("#dialog-project-label").textContent = `${categoryLabel} · 项目详情`;

  const labelsRoot = qs("#dialog-labels");
  labelsRoot.innerHTML = "";
  [categoryLabel, ...getDisplayLabels(project)].filter((value, idx, arr) => value && arr.indexOf(value) === idx).forEach((label) => {
    labelsRoot.appendChild(createPill(label));
  });

  const docsRoot = qs("#dialog-docs");
  docsRoot.innerHTML = "";
  [...project.documents, ...(project.videos || [])].forEach((doc) => docsRoot.appendChild(buildDocLink(doc)));

  const thumbsRoot = qs("#dialog-thumbs");
  thumbsRoot.innerHTML = "";
  getGalleryGroups(project, galleryEntries).forEach((group) => {
    const section = document.createElement("section");
    section.className = "dialog-media-group";

    const head = document.createElement("div");
    head.className = "dialog-media-group-head";
    head.innerHTML = `
      <p class="dialog-media-group-title">${group.label}</p>
      <p class="dialog-media-group-count">${group.total}${group.type === "asset" ? " 项" : " 张"}</p>
    `;

    const grid = document.createElement("div");
    grid.className = "thumb-grid";

    group.items.forEach((entry) => {
      const button = document.createElement("button");
      button.className = "thumb-button";
      button.type = "button";
      button.dataset.index = String(entry.index);
      if (entry.index === lightboxState.imageIndex) {
        button.classList.add("is-active");
      }

      const label = document.createElement("span");
      label.className = "thumb-button-label";
      label.textContent = entry.label;

      if (entry.type === "video") {
        button.append(createVideoElement(entry.path, "thumb-video", { autoplay: true, muted: true, loop: true }), label);
      } else {
        const image = document.createElement("img");
        image.src = toAssetUrl(entry.path);
        image.alt = `${project.name} ${entry.label}`;
        button.append(image, label);
      }

      button.addEventListener("click", () => {
        lightboxState.imageIndex = entry.index;
        updateDialogImage();
      });
      grid.appendChild(button);
    });

    section.append(head, grid);
    thumbsRoot.appendChild(section);
  });

  updateDialogImage();
  dialog.showModal();
  document.body.classList.add("dialog-open");
}

function openLightboxBySlug(slug) {
  const index = portfolioData.projects.findIndex((project) => project.slug === slug);
  if (index >= 0) {
    openLightbox(index, 0);
  }
}

function updateDialogImage() {
  const project = portfolioData.projects[lightboxState.projectIndex];
  const image = qs("#dialog-image");
  const video = qs("#dialog-video");
  const entry = lightboxState.entries[lightboxState.imageIndex];
  if (!entry) {
    return;
  }

  if (entry.type === "video") {
    image.hidden = true;
    image.removeAttribute("src");
    video.hidden = false;
    if (video.dataset.path !== entry.path) {
      video.src = toAssetUrl(entry.path);
      video.dataset.path = entry.path;
    }
    video.play().catch(() => {});
  } else {
    video.pause();
    video.hidden = true;
    video.removeAttribute("src");
    video.dataset.path = "";
    image.hidden = false;
    image.src = toAssetUrl(entry.path);
    image.alt = `${project.name} 图库第 ${lightboxState.imageIndex + 1} 张`;
  }

  qs("#dialog-stage-badge").textContent = entry.label;

  qs("#dialog-thumbs").querySelectorAll(".thumb-button").forEach((button, index) => {
    button.classList.toggle("is-active", Number(button.dataset.index) === lightboxState.imageIndex);
  });
}

function closeLightbox() {
  const dialog = qs("#gallery-dialog");
  const video = qs("#dialog-video");
  video.pause();
  video.removeAttribute("src");
  video.dataset.path = "";
  if (dialog.open) {
    dialog.close();
  }
  document.body.classList.remove("dialog-open");
}

function stepDialog(offset) {
  const total = lightboxState.entries.length;
  if (!total) {
    return;
  }
  lightboxState.imageIndex = (lightboxState.imageIndex + offset + total) % total;
  updateDialogImage();
}

function setupDialog() {
  qs("#dialog-close").addEventListener("click", closeLightbox);
  qs("#dialog-prev").addEventListener("click", () => stepDialog(-1));
  qs("#dialog-next").addEventListener("click", () => stepDialog(1));
  qs("#gallery-dialog").addEventListener("click", (event) => {
    const shell = qs(".dialog-shell");
    if (!shell.contains(event.target)) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    const dialog = qs("#gallery-dialog");
    if (!dialog.open) {
      return;
    }
    if (event.key === "Escape") {
      closeLightbox();
    }
    if (event.key === "ArrowLeft") {
      stepDialog(-1);
    }
    if (event.key === "ArrowRight") {
      stepDialog(1);
    }
  });
}

function setupReveal() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = document.querySelectorAll(".reveal");

  if (reduceMotion) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16 }
  );

  items.forEach((item) => observer.observe(item));
}

function setupActiveNav() {
  const links = Array.from(document.querySelectorAll(".site-nav a"));
  const linkMap = new Map(links.map((link) => [new URL(link.href).hash.replace("#", ""), link]));
  const sections = ["overview", "projects"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const setActive = (id) => {
    links.forEach((link) => link.classList.toggle("is-active", linkMap.get(id) === link));
  };

  if (sections.length === 0) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id) {
        setActive(visible.target.id);
      }
    },
    {
      rootMargin: "-35% 0px -50% 0px",
      threshold: [0.2, 0.45, 0.7],
    }
  );

  sections.forEach((section) => observer.observe(section));
  setActive("overview");
}

renderBrand();
renderStats();
renderHeroCategories();
renderCategoryLinks();
renderProjects();
setupDialog();
setupReveal();
setupActiveNav();
