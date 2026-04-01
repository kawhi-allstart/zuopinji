const siteContent = window.siteContent;
const portfolioData = window.portfolioData;

const qs = (selector) => document.querySelector(selector);
const toAssetUrl = (path) => path.split("/").map(encodeURIComponent).join("/");
const IMAGE_VARIANTS = portfolioData.imageVariants || {};
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
const PERSONAL_FOLDER_ORDER = [
  "BIM设计稿",
  "su设计稿",
];
const PERSONAL_LABEL_DISPLAY = {
  "AI编程": "ai编程探索",
  "APP开发": "App开发",
  "桌面程序": "桌面应用开发",
  "桌面程序设计": "桌面应用开发",
};
const PERSONAL_CHILD_GROUP_ORDER = {
  "ai编程探索": ["网页设计", "App开发", "桌面应用开发"],
};
const PERSONAL_PROJECT_ORDER = {
  "ai编程探索/网页设计": ["可视化管理系统开发", "公司网站设计"],
};
const CATEGORY_COVER_PREFERENCES = {
  "我的作品": ["博亚时代中心项目全专业BIM设计"],
};
const HOME_PAGE_KEY = "home";
const PAGE_MODE = document.body.dataset.page || HOME_PAGE_KEY;
const PAGE_CATEGORY = document.body.dataset.category || "";
const ALL_PROJECT_ENTRIES = portfolioData.projects.map((project, index) => ({ project, index }));
const NAV_ITEMS = [
  { key: HOME_PAGE_KEY, label: "首页", href: "./index.html" },
  { key: "21年至今我管理的项目", label: "管理的项目", href: "./managed.html" },
  { key: "19-20年我参与的项目", label: "参与的项目", href: "./participated.html" },
  { key: "我的作品", label: "我的作品", href: "./personal.html" },
];
const textCollator = new Intl.Collator("zh-Hans-CN", { numeric: true, sensitivity: "base" });

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

function getImageAssetPath(path, variant = "full") {
  if (!path || variant === "full") {
    return path;
  }
  return IMAGE_VARIANTS[path]?.[variant] || path;
}

function setImageAsset(image, path, options = {}) {
  if (!image || !path) {
    return;
  }

  const {
    alt = "",
    variant = "full",
    loading = "lazy",
    decoding = "async",
    fetchPriority,
  } = options;

  image.src = toAssetUrl(getImageAssetPath(path, variant));
  image.alt = alt;
  image.loading = loading;
  image.decoding = decoding;

  if (fetchPriority) {
    image.fetchPriority = fetchPriority;
  }
}

function getCategoryContent(name) {
  return siteContent.categories[name] || {
    displayTitle: name,
    shortLabel: name,
    description: "项目资料已归档到当前板块。",
    cardSummary: ""
  };
}

function isHomePage() {
  return PAGE_MODE === HOME_PAGE_KEY;
}

function isCategoryPage() {
  return PAGE_MODE === "category" && Boolean(PAGE_CATEGORY);
}

function getCurrentPageKey() {
  return isCategoryPage() ? PAGE_CATEGORY : HOME_PAGE_KEY;
}

function getCategoryHref(categoryName) {
  return NAV_ITEMS.find((item) => item.key === categoryName)?.href || "./index.html";
}

function getPageEntries() {
  if (!isCategoryPage()) {
    return ALL_PROJECT_ENTRIES;
  }
  return ALL_PROJECT_ENTRIES.filter(({ project }) => project.category === PAGE_CATEGORY);
}

function getCategoryCoverProject(group) {
  const preferredProjectNames = CATEGORY_COVER_PREFERENCES[group.category] || [];

  for (const projectName of preferredProjectNames) {
    const preferredEntry = group.items.find(({ project }) => project.name === projectName);
    if (preferredEntry?.project?.cover) {
      return preferredEntry.project;
    }
  }

  return group.items.find(({ project }) => project.cover)?.project || group.items[0]?.project;
}

function sumProjectCounts(entries = ALL_PROJECT_ENTRIES) {
  return entries.reduce((totals, { project }) => {
    totals.projects += 1;
    totals.renderings += project.counts.renderings;
    totals.photos += project.counts.photos;
    totals.videos += project.counts.videos;
    totals.documents += project.counts.documents;
    return totals;
  }, {
    projects: 0,
    renderings: 0,
    photos: 0,
    videos: 0,
    documents: 0,
  });
}

function getPageContent() {
  if (isHomePage()) {
    return {
      documentTitle: "袁润的作品集",
      hero: {
        eyebrow: siteContent.hero.eyebrow,
        title: siteContent.hero.title,
        summary: siteContent.hero.summary,
        target: siteContent.hero.target,
        showActions: false,
        primaryCta: {
          label: "管理的项目",
          href: getCategoryHref("21年至今我管理的项目"),
        },
        secondaryCta: {
          label: "我的作品",
          href: getCategoryHref("我的作品"),
        },
      },
      heroBoard: siteContent.heroBoard,
      projectSection: siteContent.projectSection,
      showProjects: false,
    };
  }

  const content = getCategoryContent(PAGE_CATEGORY);
  return {
    documentTitle: `${content.displayTitle} | 袁润的作品集`,
    hero: {
      eyebrow: "",
      title: content.displayTitle,
      summary: content.description,
      target: "当前页面仅加载该板块内容，浏览更轻；点击项目封面仍可查看完整图库。",
      showActions: true,
      primaryCta: {
        label: "返回首页",
        href: "./index.html",
      },
      secondaryCta: {
        label: "查看项目列表",
        href: "#projects",
      },
    },
    heroBoard: {
      tag: "Browse Pages",
      title: "切换其他板块",
    },
    projectSection: {
      tag: "",
      title: content.displayTitle,
      intro: content.description,
    },
    showProjects: true,
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

function renderDocLinks(root, documents = []) {
  root.innerHTML = "";
  root.hidden = documents.length === 0;
  documents.forEach((doc) => root.appendChild(buildDocLink(doc)));
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

function formatPersonalLabel(label) {
  return PERSONAL_LABEL_DISPLAY[label] || label;
}

function getDisplayLabels(project) {
  const filtered = project.labels
    .filter((label) => !GENERIC_LABELS.has(label))
    .map((label) => formatPersonalLabel(label));
  return filtered.filter((label, index) => label && filtered.indexOf(label) === index);
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
  if ((project.videos || []).length > 0) {
    return "视频";
  }
  if (project.renderings.length > 0 && project.photos.length > 0) {
    return "效果图 / 实景";
  }
  if (project.renderings.length > 0) {
    return "效果图";
  }
  if (project.photos.length > 0) {
    return "实景";
  }
  return project.highlights[0] || "项目资料";
}

function getProjectCoverHint(project) {
  if ((project.videos || []).length > 0) {
    return "点击封面查看视频播放";
  }
  if (project.renderings.length > 0 || project.photos.length > 0) {
    return "";
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
    setImageAsset(image, previewPath, {
      alt: `${project.name} ${MEDIA_META[type].label}预览`,
      variant: "tile",
    });
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

function groupProjects(entries = ALL_PROJECT_ENTRIES) {
  const map = new Map();

  entries.forEach(({ project, index }) => {
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

function getProjectLineage(project) {
  return Array.isArray(project.lineage) ? project.lineage.filter(Boolean) : [];
}

function getProjectSourcePath(project) {
  return project.sourcePath || [...getProjectLineage(project), project.name].join("/");
}

function getPersonalTopFolderTitle(project) {
  const lineage = getProjectLineage(project);
  if (lineage.length > 0) {
    return formatPersonalLabel(lineage[0]);
  }

  const sourceFolder = (project.sourcePath || "")
    .split("/")
    .filter(Boolean)
    .pop();
  return formatPersonalLabel(sourceFolder || project.name);
}

function comparePath(a, b) {
  const normalizedA = a.toLowerCase();
  const normalizedB = b.toLowerCase();
  if (normalizedA < normalizedB) {
    return -1;
  }
  if (normalizedA > normalizedB) {
    return 1;
  }
  return 0;
}

function compareText(a, b) {
  return textCollator.compare(a, b);
}

function comparePersonalFolderTitle(a, b) {
  const orderA = PERSONAL_FOLDER_ORDER.indexOf(a);
  const orderB = PERSONAL_FOLDER_ORDER.indexOf(b);
  const safeA = orderA === -1 ? PERSONAL_FOLDER_ORDER.length : orderA;
  const safeB = orderB === -1 ? PERSONAL_FOLDER_ORDER.length : orderB;

  if (safeA !== safeB) {
    return safeA - safeB;
  }

  return compareText(a, b);
}

function comparePersonalChildGroup(folderTitle, a, b, orderKeyA, orderKeyB) {
  const orderedTitles = PERSONAL_CHILD_GROUP_ORDER[folderTitle];
  if (orderedTitles) {
    const orderA = orderedTitles.indexOf(a);
    const orderB = orderedTitles.indexOf(b);
    const safeA = orderA === -1 ? orderedTitles.length : orderA;
    const safeB = orderB === -1 ? orderedTitles.length : orderB;

    if (safeA !== safeB) {
      return safeA - safeB;
    }
  }

  const titleCompare = compareText(a, b);
  if (titleCompare !== 0) {
    return titleCompare;
  }

  return comparePath(orderKeyA, orderKeyB);
}

function compareProjectItems(a, b) {
  const lineageA = getProjectLineage(a.project).map((label) => formatPersonalLabel(label)).join("/");
  const lineageB = getProjectLineage(b.project).map((label) => formatPersonalLabel(label)).join("/");
  if (lineageA && lineageA === lineageB) {
    const orderedTitles = PERSONAL_PROJECT_ORDER[lineageA];
    if (orderedTitles) {
      const orderA = orderedTitles.indexOf(a.project.name);
      const orderB = orderedTitles.indexOf(b.project.name);
      const safeA = orderA === -1 ? orderedTitles.length : orderA;
      const safeB = orderB === -1 ? orderedTitles.length : orderB;
      if (safeA !== safeB) {
        return safeA - safeB;
      }
    }
  }

  const pathA = getProjectSourcePath(a.project);
  const pathB = getProjectSourcePath(b.project);
  const pathCompare = comparePath(pathA, pathB);
  if (pathCompare !== 0) {
    return pathCompare;
  }
  return compareText(a.project.name, b.project.name);
}

function formatCategoryMeta(group, variant = "default") {
  if (group.category === "我的作品") {
    const topFolders = new Set(group.items.map((item) => getProjectLineage(item.project)[0] || item.project.name));
    if (variant === "card") {
      return `${group.items.length} 个作品`;
    }
    return `${topFolders.size} 个目录 / ${group.items.length} 个作品`;
  }
  return `${group.items.length} 个项目`;
}

function formatCountValue(value) {
  return String(value);
}

function renderPrimaryNav() {
  const nav = qs(".site-nav");
  if (!nav) {
    return;
  }

  nav.hidden = false;
  nav.innerHTML = "";
  NAV_ITEMS.forEach((item) => {
    const link = document.createElement("a");
    link.href = item.href;
    link.dataset.pageKey = item.key;
    link.textContent = item.label;
    if (item.key === getCurrentPageKey()) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
    nav.appendChild(link);
  });
}

function buildProjectCard(template, item, indexLabel) {
  const { project, index } = item;
  const fragment = template.content.cloneNode(true);
  const card = fragment.querySelector(".project-card");
  const coverButton = fragment.querySelector(".project-cover");
  const coverImage = fragment.querySelector(".project-cover-image");
  const coverHint = getProjectCoverHint(project);
  const coverHintNode = fragment.querySelector(".project-cover-count");
  const labelsRoot = fragment.querySelector(".project-labels");
  const docsRoot = fragment.querySelector(".project-docs");
  const mediaStrip = fragment.querySelector(".project-media-strip");

  fragment.querySelector(".project-cover-label").textContent = getProjectCoverLabel(project);
  if (coverHint) {
    coverHintNode.textContent = coverHint;
  } else {
    coverHintNode.remove();
  }
  fragment.querySelector(".project-index").textContent = indexLabel;
  fragment.querySelector(".project-counts").textContent = formatProjectAssetCount(project);
  fragment.querySelector(".project-title").textContent = project.name;
  const projectSummary = fragment.querySelector(".project-summary");
  projectSummary.textContent = project.summary || "";
  projectSummary.hidden = !project.summary;

  if ((project.videos || []).length > 0) {
    coverImage.remove();
    coverButton.classList.add("has-video");
    coverButton.prepend(createVideoElement(project.videos[0].path, "project-cover-video", {
      autoplay: true,
      muted: true,
      loop: true,
    }));
  } else if (project.cover) {
    setImageAsset(coverImage, project.cover, {
      alt: `${project.name} 封面图`,
      variant: "card",
    });
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
  renderDocLinks(docsRoot, project.documents);

  if (project.showcaseImages.length > 0 || (project.videos || []).length > 0) {
    const coverOpenIndex = (project.videos || []).length > 0 ? getFirstGalleryIndex(project, "video") : 0;
    coverButton.addEventListener("click", () => openLightbox(index, Math.max(0, coverOpenIndex)));
  } else {
    coverButton.disabled = true;
  }

  return card;
}

function buildPersonalFolderGroups(items) {
  const folderMap = new Map();

  items.forEach((item) => {
    const lineage = getProjectLineage(item.project);
    const topTitle = getPersonalTopFolderTitle(item.project);
    if (!folderMap.has(topTitle)) {
      folderMap.set(topTitle, {
        title: topTitle,
        orderKey: getProjectSourcePath(item.project),
        directItems: [],
        childGroups: new Map(),
      });
    }

    const folderGroup = folderMap.get(topTitle);
    if (lineage.length > 1) {
      const childTitle = formatPersonalLabel(lineage[1]);
      if (!folderGroup.childGroups.has(childTitle)) {
        folderGroup.childGroups.set(childTitle, {
          title: childTitle,
          displayTitle: childTitle,
          orderKey: getProjectSourcePath(item.project),
          items: [],
        });
      }
      folderGroup.childGroups.get(childTitle).items.push(item);
      return;
    }

    folderGroup.directItems.push(item);
  });

  return Array.from(folderMap.values())
    .sort((a, b) => {
      const titleCompare = comparePersonalFolderTitle(a.title, b.title);
      if (titleCompare !== 0) {
        return titleCompare;
      }
      return comparePath(a.orderKey, b.orderKey);
    })
    .map((folderGroup) => ({
      title: folderGroup.title,
      directItems: folderGroup.directItems.sort(compareProjectItems),
      childGroups: Array.from(folderGroup.childGroups.values())
        .sort((a, b) => comparePersonalChildGroup(folderGroup.title, a.displayTitle, b.displayTitle, a.orderKey, b.orderKey))
        .map((childGroup) => ({
          title: childGroup.title,
          displayTitle: childGroup.displayTitle,
          items: childGroup.items.sort(compareProjectItems),
        })),
    }));
}

function getPersonalFolderMeta(folderGroup) {
  const childCount = folderGroup.childGroups.reduce((sum, childGroup) => sum + childGroup.items.length, 0);
  const total = folderGroup.directItems.length + childCount;
  if (folderGroup.childGroups.length > 0) {
    return `${folderGroup.childGroups.length} 个子目录 / ${total} 个项目`;
  }
  return `${total} 个项目`;
}

function getPersonalFolderSummary(folderTitle) {
  const orderedTitles = PERSONAL_CHILD_GROUP_ORDER[folderTitle];
  if (!orderedTitles || orderedTitles.length === 0) {
    return "";
  }
  return `分板块：${orderedTitles.join(" | ")}`;
}

function renderPersonalProjects(section, group, template) {
  const stack = document.createElement("div");
  stack.className = "folder-stack";

  buildPersonalFolderGroups(group.items).forEach((folderGroup) => {
    const folderSection = document.createElement("section");
    folderSection.className = "folder-section";

    const folderHead = document.createElement("div");
    folderHead.className = "folder-section-head";

    const folderCopy = document.createElement("div");
    folderCopy.className = "folder-section-copy";

    const folderTitle = document.createElement("h4");
    folderTitle.className = "folder-section-title";
    folderTitle.textContent = folderGroup.title;

    folderCopy.appendChild(folderTitle);

    const folderSummaryText = getPersonalFolderSummary(folderGroup.title);
    if (folderSummaryText) {
      const folderSummary = document.createElement("p");
      folderSummary.className = "folder-section-summary";
      folderSummary.textContent = folderSummaryText;
      folderCopy.appendChild(folderSummary);
    }

    const folderMeta = document.createElement("p");
    folderMeta.className = "folder-section-meta";
    folderMeta.textContent = getPersonalFolderMeta(folderGroup);

    folderHead.append(folderCopy, folderMeta);
    folderSection.appendChild(folderHead);

    if (folderGroup.directItems.length > 0) {
      const directGrid = document.createElement("div");
      directGrid.className = "category-project-grid";
      folderGroup.directItems.forEach((item) => {
        directGrid.appendChild(buildProjectCard(template, item, folderGroup.title));
      });
      folderSection.appendChild(directGrid);
    }

    folderGroup.childGroups.forEach((childGroup) => {
      const childSection = document.createElement("section");
      childSection.className = "folder-subsection";

      const childHead = document.createElement("div");
      childHead.className = "folder-subsection-head";

      const childTitle = document.createElement("h5");
      childTitle.className = "folder-subsection-title";
      childTitle.textContent = childGroup.displayTitle;

      const childMeta = document.createElement("p");
      childMeta.className = "folder-subsection-meta";
      childMeta.textContent = `${childGroup.items.length} 个项目`;

      childHead.append(childTitle, childMeta);
      childSection.appendChild(childHead);

      const childGrid = document.createElement("div");
      childGrid.className = "category-project-grid";
      childGroup.items.forEach((item) => {
        childGrid.appendChild(buildProjectCard(template, item, `${folderGroup.title} / ${childGroup.displayTitle}`));
      });

      childSection.appendChild(childGrid);
      folderSection.appendChild(childSection);
    });

    stack.appendChild(folderSection);
  });

  section.appendChild(stack);
}

function renderBrand() {
  const pageContent = getPageContent();
  document.title = pageContent.documentTitle;

  const brandLink = qs(".brand-lockup");
  if (brandLink) {
    brandLink.href = "./index.html";
  }

  renderPrimaryNav();
  qs("#brand-mark").textContent = siteContent.brand.mark;
  qs("#brand-title").textContent = siteContent.brand.title;
  qs("#brand-subtitle").textContent = siteContent.brand.subtitle;

  const heroEyebrow = qs("#hero-eyebrow");
  if (heroEyebrow) {
    heroEyebrow.textContent = pageContent.hero.eyebrow || "";
    heroEyebrow.hidden = !pageContent.hero.eyebrow;
  }
  qs("#hero-title").textContent = pageContent.hero.title;
  qs("#hero-summary").textContent = pageContent.hero.summary;
  const heroTarget = qs("#hero-target");
  if (heroTarget) {
    heroTarget.textContent = pageContent.hero.target || "";
    heroTarget.hidden = !pageContent.hero.target;
  }

  const heroActions = qs(".hero-actions");
  const heroPrimary = qs("#hero-primary");
  const heroSecondary = qs("#hero-secondary");
  if (heroActions) {
    heroActions.hidden = pageContent.hero.showActions === false;
  }
  if (heroPrimary && heroSecondary) {
    heroPrimary.textContent = pageContent.hero.primaryCta.label;
    heroPrimary.href = pageContent.hero.primaryCta.href;
    heroSecondary.textContent = pageContent.hero.secondaryCta.label;
    heroSecondary.href = pageContent.hero.secondaryCta.href;
  }

  const heroBoardTag = qs("#hero-board-tag");
  heroBoardTag.textContent = pageContent.heroBoard.tag;
  heroBoardTag.hidden = !pageContent.heroBoard.tag;
  qs("#hero-board-title").textContent = pageContent.heroBoard.title;

  const projectSectionTag = qs("#project-section-tag");
  projectSectionTag.textContent = pageContent.projectSection.tag;
  projectSectionTag.hidden = !pageContent.projectSection.tag;
  qs("#project-section-title").textContent = pageContent.projectSection.title;
  qs("#project-section-intro").textContent = pageContent.projectSection.intro;

  qs("#footer-text").textContent = siteContent.footer;
}

function fitTitleToSingleLine(element, options = {}) {
  if (!element) {
    return;
  }

  const {
    minFontSize = 22,
    maxFontSize = 67,
    preferredRatio = 0.038,
    insertWordJoiners = false,
  } = options;

  const rawTitle = element.dataset.rawTitle || element.textContent || "";
  element.dataset.rawTitle = rawTitle;
  element.textContent = insertWordJoiners ? Array.from(rawTitle).join("\u2060") : rawTitle;
  element.setAttribute("aria-label", rawTitle);
  element.style.maxWidth = "none";
  element.style.whiteSpace = "nowrap";

  const preferredFontSize = Math.max(
    minFontSize,
    Math.min(maxFontSize, window.innerWidth * preferredRatio)
  );
  element.style.fontSize = `${preferredFontSize}px`;

  const containerWidth = element.parentElement?.clientWidth || element.clientWidth;
  if (!containerWidth || element.scrollWidth <= containerWidth) {
    return;
  }

  const fittedFontSize = Math.max(
    minFontSize,
    Math.floor((preferredFontSize * containerWidth) / element.scrollWidth)
  );
  element.style.fontSize = `${fittedFontSize}px`;
}

function fitCategoryHeroTitle() {
  if (!isCategoryPage()) {
    return;
  }

  fitTitleToSingleLine(qs("#hero-title"), {
    minFontSize: 22,
    maxFontSize: 67,
    preferredRatio: 0.038,
    insertWordJoiners: true,
  });

  fitTitleToSingleLine(qs("#project-section-title"), {
    minFontSize: 20,
    maxFontSize: 54,
    preferredRatio: 0.034,
  });
}

let pendingTitleFitFrame = 0;
function scheduleCategoryTitleFit() {
  if (pendingTitleFitFrame) {
    cancelAnimationFrame(pendingTitleFitFrame);
  }

  pendingTitleFitFrame = window.requestAnimationFrame(() => {
    pendingTitleFitFrame = 0;
    fitCategoryHeroTitle();
  });
}

function renderStats() {
  const template = qs("#stat-template");
  const root = qs("#hero-stats");
  root.innerHTML = "";

  let stats = [];
  if (isHomePage()) {
    const groups = groupProjects(ALL_PROJECT_ENTRIES);
    const getGroupCount = (name) => groups.find((group) => group.category === name)?.items.length || 0;
    stats = [
      {
        key: "21年至今我管理的项目",
        value: formatCountValue(getGroupCount("21年至今我管理的项目")),
        label: getCategoryContent("21年至今我管理的项目").shortLabel,
        href: getCategoryHref("21年至今我管理的项目"),
      },
      {
        key: "19-20年我参与的项目",
        value: formatCountValue(getGroupCount("19-20年我参与的项目")),
        label: getCategoryContent("19-20年我参与的项目").shortLabel,
        href: getCategoryHref("19-20年我参与的项目"),
      },
      {
        key: "我的作品",
        value: formatCountValue(getGroupCount("我的作品")),
        label: getCategoryContent("我的作品").shortLabel,
        href: getCategoryHref("我的作品"),
      },
    ];
  } else {
    const counts = sumProjectCounts(getPageEntries());
    stats = [
      { value: formatCountValue(counts.projects), label: "项目数量" },
      { value: formatCountValue(counts.renderings + counts.photos), label: "图片数量" },
      { value: formatCountValue(counts.videos), label: "视频数量" },
      { value: formatCountValue(counts.documents), label: "资料数量" },
    ];
  }

  stats.forEach((item) => {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector(".stat-card");
    card.querySelector(".stat-value").textContent = item.value;
    card.querySelector(".stat-label").textContent = item.label;

    if (item.href) {
      const link = document.createElement("a");
      link.className = "stat-card-link";
      link.href = item.href;
      link.dataset.pageKey = item.key;
      link.setAttribute("aria-label", `查看${item.label}`);
      card.classList.add("is-interactive");
      link.appendChild(card);
      root.appendChild(link);
      return;
    }

    root.appendChild(fragment);
  });

  root.style.gridTemplateColumns = `repeat(${stats.length}, minmax(0, 1fr))`;
}

function renderHeroCategories() {
  const template = qs("#category-card-template");
  const root = qs("#hero-category-grid");
  root.innerHTML = "";
  const groups = groupProjects(ALL_PROJECT_ENTRIES);

  groups.forEach((group) => {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector(".category-card");
    const media = fragment.querySelector(".category-card-media");
    const image = fragment.querySelector("img");
    const kicker = fragment.querySelector(".category-card-kicker");
    const coverProject = getCategoryCoverProject(group);
    const displayTitle = group.content.displayTitle || group.category;

    card.href = getCategoryHref(group.category);
    card.dataset.pageKey = group.category;
    kicker.textContent = isHomePage() ? "" : group.content.shortLabel;
    kicker.hidden = isHomePage() || !group.content.shortLabel;
    fragment.querySelector(".category-card-title").textContent = displayTitle;
    fragment.querySelector(".category-card-body").textContent = group.content.cardSummary || group.content.description;
    fragment.querySelector(".category-card-meta").textContent = formatCategoryMeta(group, "card");

    if (group.category === getCurrentPageKey()) {
      card.classList.add("is-current");
      card.setAttribute("aria-current", "page");
    }

    if (coverProject?.cover) {
      setImageAsset(image, coverProject.cover, {
        alt: `${displayTitle} 封面图`,
        variant: "card",
        loading: "eager",
        fetchPriority: "high",
      });
    } else {
      image.remove();
      media.appendChild(createFallback(group.content.shortLabel, "资料归档", "category-fallback"));
    }

    root.appendChild(fragment);
  });
}

function renderCategoryLinks() {
  const root = qs("#category-links");
  if (!root) {
    return;
  }

  if (isCategoryPage()) {
    root.hidden = true;
    root.innerHTML = "";
    return;
  }

  root.hidden = false;
  root.innerHTML = "";

  NAV_ITEMS.forEach((item) => {
    const link = document.createElement("a");
    link.className = "section-link";
    link.href = item.href;
    link.dataset.pageKey = item.key;
    if (item.key === HOME_PAGE_KEY) {
      link.textContent = item.label;
    } else {
      const total = groupProjects(ALL_PROJECT_ENTRIES).find((group) => group.category === item.key)?.items.length || 0;
      link.textContent = `${item.label} · ${total}`;
    }
    if (item.key === getCurrentPageKey()) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
    root.appendChild(link);
  });
}

function renderProjects() {
  const template = qs("#project-template");
  const root = qs("#project-list");
  if (!root) {
    return;
  }

  root.innerHTML = "";

  groupProjects(getPageEntries()).forEach((group) => {
    const section = document.createElement("section");
    section.className = "category-section";
    section.id = group.sectionId;

    if (!isCategoryPage()) {
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
    }

    if (group.category === "我的作品") {
      renderPersonalProjects(section, group, template);
      root.appendChild(section);
      return;
    }

    const grid = document.createElement("div");
    grid.className = "category-project-grid";

    group.items.forEach((item, itemIndex) => {
      grid.appendChild(
        buildProjectCard(template, item, `${group.content.shortLabel} / ${String(itemIndex + 1).padStart(2, "0")}`)
      );
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
  const dialogSummary = qs("#dialog-summary");
  dialogSummary.textContent = project.summary || "";
  dialogSummary.hidden = !project.summary;

  const categoryLabel = getCategoryContent(project.category).shortLabel;
  qs("#dialog-project-label").textContent = `${categoryLabel} · 项目详情`;

  const labelsRoot = qs("#dialog-labels");
  labelsRoot.innerHTML = "";
  [categoryLabel, ...getDisplayLabels(project)].filter((value, idx, arr) => value && arr.indexOf(value) === idx).forEach((label) => {
    labelsRoot.appendChild(createPill(label));
  });

  const docsRoot = qs("#dialog-docs");
  renderDocLinks(docsRoot, project.documents);

  const thumbsRoot = qs("#dialog-thumbs");
  thumbsRoot.innerHTML = "";
  getGalleryGroups(project, galleryEntries).forEach((group) => {
    const section = document.createElement("section");
    section.className = "dialog-media-group";

    const head = document.createElement("div");
    head.className = "dialog-media-group-head";
    head.innerHTML = `
      <p class="dialog-media-group-title">${group.label}</p>
      <p class="dialog-media-group-count">${group.total}${group.type === "video" ? " 个" : group.type === "asset" ? " 项" : " 张"}</p>
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
        setImageAsset(image, entry.path, {
          alt: `${project.name} ${entry.label}`,
          variant: "tile",
        });
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

  if (reduceMotion || isCategoryPage()) {
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

function setupPageLayout() {
  const heroSection = qs("#overview");
  const projectSection = qs("#projects");

  if (heroSection) {
    heroSection.hidden = !isHomePage();
  }

  if (!projectSection) {
    return;
  }

  projectSection.hidden = !getPageContent().showProjects;
}

function setupActiveNav() {
  const currentPageKey = getCurrentPageKey();
  document.querySelectorAll(".site-nav a, .section-link").forEach((link) => {
    const isActive = link.dataset.pageKey === currentPageKey;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

renderBrand();
setupPageLayout();
scheduleCategoryTitleFit();
if (isHomePage()) {
  renderStats();
  renderHeroCategories();
}
if (getPageContent().showProjects) {
  renderCategoryLinks();
  renderProjects();
}
setupDialog();
setupReveal();
setupActiveNav();

window.addEventListener("resize", scheduleCategoryTitleFit);
document.fonts?.ready.then(scheduleCategoryTitleFit);
