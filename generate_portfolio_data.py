from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageOps, UnidentifiedImageError


ROOT = Path(__file__).resolve().parent
LIBRARY_DIR = ROOT / "作品库"
OUTPUT_FILE = ROOT / "portfolio-data.js"
THUMBNAIL_DIR = ROOT / "generated" / "image-variants"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".avif"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm", ".m4v"}
DOCUMENT_EXTENSIONS = {".pdf", ".txt", ".md", ".doc", ".docx"}
TEXT_EXTENSIONS = {".txt", ".md"}
PROJECT_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS | DOCUMENT_EXTENSIONS
WEB_VIDEO_SUFFIXES = ("-web", "_web")

FOLDER_ALIASES = {
    "文字描述": "description",
    "描述": "description",
    "效果图": "renderings",
    "真实照片": "photos",
    "实景": "photos",
    "视频": "videos",
    "漫游": "videos",
}

KEYWORD_LABELS = [
    ("鸟瞰", "鸟瞰视角"),
    ("总平", "总平布局"),
    ("主入口", "主入口透视"),
    ("沿街", "沿街界面"),
    ("夜景", "夜景效果"),
    ("幕墙", "幕墙方案"),
    ("河道", "河道景观"),
    ("景观", "景观设计"),
]

IGNORED_DIR_KEYWORDS = ["搜索 图片_files", "__macosx"]
IGNORED_FILE_EXTENSIONS = {".html", ".css", ".js", ".svg", ".下载"}

CATEGORY_LABELS = {
    "19-20年我参与的项目": "参与项目",
    "21年至今我管理的项目": "管理项目",
    "我的作品": "我的作品",
}

FOLDER_DISPLAY_LABELS = {
    "ai编程": "AI编程",
    "APP开发": "App开发",
    "网页设计稿": "网页设计",
    "桌面程序设计": "桌面应用开发",
    "su设计稿": "SketchUp",
}

AI_PROGRAMMING_BASE_LABELS = {
    "网页设计": ["Python", "数据库"],
    "App开发": ["Java", "数据库"],
    "桌面应用开发": ["Python"],
}

AI_PROJECT_EXTRA_LABELS = {
    "可视化管理系统": ["数据可视化", "管理后台"],
    "公司网站": ["企业官网", "响应式"],
    "K线预测分析": ["数据分析", "量化研究"],
    "预警器系统": ["实时预警", "监控面板"],
    "情绪分析系统": ["情感分析", "视频演示"],
    "家庭储物": ["移动端", "生活工具"],
    "家庭储物系统": ["移动端", "生活工具"],
    "情侣评分系统": ["移动端", "互动产品"],
    "工作助手": ["自动化", "效率工具"],
}

PROJECT_COVER_OVERRIDES = {
    "鄂州网驿科技港": "H22120533-bd-hqw-wqqg (1).jpg",
    "江门网驿智造科技港": "2022-03-2.jpg",
    "湘潭网驿电子信息产业园": "H21100556_bd-c01-hqw-wzy (2).jpg",
    "情侣评分系统": "df034cf08fcb62d30e1473629dc52a6f.jpg",
    "可视化管理系统": "屏幕截图 2026-03-31 201347.png",
    "公司网站": "屏幕截图 2026-03-31 200924.png",
}

PROJECT_TITLE_OVERRIDES = {
    "BIM设计稿": "博亚时代中心项目全专业BIM设计",
    "su设计稿": "产业园区项目拿地强排方案su模型",
    "可视化管理系统": "可视化管理系统开发",
    "公司网站": "公司网站设计",
    "K线预测分析": "K线预测分析系统开发",
    "情绪分析系统": "市场情绪分析系统开发",
    "预警器系统": "预警器系统设计与开发",
    "工作助手": "工作助手系统设计与开发",
    "家庭储物系统": "家庭储物系统设计与开发",
    "情侣评分系统": "情侣评分系统设计与开发",
}

IGNORED_PROJECT_NAMES = {
    "手游",
}

EMPTY_SUMMARY_PROJECTS = {
    "BIM设计稿",
    "su设计稿",
    "可视化管理系统",
    "公司网站",
    "预警器系统",
    "情绪分析系统",
    "K线预测分析",
    "家庭储物系统",
    "情侣评分系统",
    "手游",
    "工作助手",
}

CATEGORY_ORDER = {name: index for index, name in enumerate(CATEGORY_LABELS)}
PROJECT_ORDER_OVERRIDES = {
    "19-20年我参与的项目": {
        "博亚时代中心": 0,
        "Mo.C时光会": 1,
    },
    "21年至今我管理的项目": {
        "舟山网驿科技智造港": 0,
        "江门网驿智造科技港": 1,
        "鄂州网驿科技港": 100,
        "柳州网驿大健康产业园": 101,
        "湘潭网驿电子信息产业园": 102,
        "仙桃网驿智能制造园": 103,
    }
}

IMAGE_FORMAT_PRIORITY = {
    ".jpg": 0,
    ".jpeg": 0,
    ".png": 0,
    ".webp": 1,
    ".avif": 1,
    ".gif": 2,
    ".bmp": 2,
}
IMAGE_VARIANT_SPECS = {
    "card": {
        "folder": "card",
        "max_size": (1600, 1000),
        "quality": 82,
    },
    "tile": {
        "folder": "tile",
        "max_size": (480, 360),
        "quality": 74,
    },
}
IMAGE_VARIANT_CACHE: dict[tuple[str, str], str] = {}

Image.MAX_IMAGE_PIXELS = None


def natural_sort_key(text: str) -> list[object]:
    return [int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", text)]


def make_slug(text: str) -> str:
    slug = re.sub(r"\W+", "-", text.strip().lower(), flags=re.UNICODE).strip("-")
    return slug or "project"


def normalize_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def ensure_thumbnail_dir() -> None:
    THUMBNAIL_DIR.mkdir(parents=True, exist_ok=True)


def get_thumbnail_output_path(path: Path, variant: str) -> Path:
    spec = IMAGE_VARIANT_SPECS[variant]
    fingerprint = hashlib.sha1(f"{normalize_path(path)}::{variant}".encode("utf-8")).hexdigest()[:20]
    return THUMBNAIL_DIR / spec["folder"] / f"{fingerprint}.webp"


def save_image_variant(path: Path, variant: str) -> str:
    cache_key = (normalize_path(path), variant)
    if cache_key in IMAGE_VARIANT_CACHE:
        return IMAGE_VARIANT_CACHE[cache_key]

    target = get_thumbnail_output_path(path, variant)
    source_mtime = path.stat().st_mtime
    target.parent.mkdir(parents=True, exist_ok=True)

    if not target.exists() or target.stat().st_mtime < source_mtime:
        spec = IMAGE_VARIANT_SPECS[variant]
        try:
            with Image.open(path) as raw_image:
                image = ImageOps.exif_transpose(raw_image)
                image.load()
                has_alpha = "A" in image.getbands()

                if has_alpha and image.mode != "RGBA":
                    image = image.convert("RGBA")
                if not has_alpha and image.mode != "RGB":
                    image = image.convert("RGB")

                image.thumbnail(spec["max_size"], Image.Resampling.LANCZOS)
                image.save(
                    target,
                    format="WEBP",
                    quality=spec["quality"],
                    method=6,
                )
        except (UnidentifiedImageError, OSError, ValueError):
            fallback = normalize_path(path)
            IMAGE_VARIANT_CACHE[cache_key] = fallback
            return fallback

    variant_path = normalize_path(target)
    IMAGE_VARIANT_CACHE[cache_key] = variant_path
    return variant_path


def register_image_variants(paths: list[Path], registry: dict[str, dict[str, str]]) -> None:
    for path in paths:
        normalized = normalize_path(path)
        variant_entry = registry.setdefault(normalized, {})
        for variant in IMAGE_VARIANT_SPECS:
            if variant not in variant_entry:
                variant_entry[variant] = save_image_variant(path, variant)


def get_category_label(category_name: str | None) -> str:
    if not category_name:
        return "项目归档"
    return CATEGORY_LABELS.get(category_name, category_name)


def format_folder_label(text: str) -> str:
    return FOLDER_DISPLAY_LABELS.get(text, text)


def append_unique(target: list[str], values: list[str]) -> None:
    for value in values:
        if value and value not in target:
            target.append(value)


def get_ai_programming_labels(project_dir: Path, project_name: str, lineage_labels: list[str]) -> list[str]:
    if "AI编程" not in lineage_labels:
        return []

    labels: list[str] = []
    subgroup = lineage_labels[1] if len(lineage_labels) > 1 else ""
    append_unique(labels, AI_PROGRAMMING_BASE_LABELS.get(subgroup, []))

    for candidate in (project_dir.name, project_name):
        append_unique(labels, AI_PROJECT_EXTRA_LABELS.get(candidate, []))

    return labels


def get_project_sort_priority(category_name: str, project_name: str) -> int:
    category_overrides = PROJECT_ORDER_OVERRIDES.get(category_name, {})
    return category_overrides.get(project_name, 50)


def get_image_format_priority(path: Path) -> int:
    return IMAGE_FORMAT_PRIORITY.get(path.suffix.lower(), 3)


def file_hash(path: Path) -> str:
    digest = hashlib.sha1()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def dedupe_files(paths: list[Path], seen_hashes: set[str] | None = None) -> list[Path]:
    known_hashes = seen_hashes if seen_hashes is not None else set()
    unique_paths: list[Path] = []

    for path in paths:
        fingerprint = file_hash(path)
        if fingerprint in known_hashes:
            continue
        known_hashes.add(fingerprint)
        unique_paths.append(path)

    return unique_paths


def list_files(folder: Path, extensions: set[str]) -> list[Path]:
    return sorted(
        [
            path
            for path in folder.iterdir()
            if path.is_file()
            and path.suffix.lower() in extensions
            and path.suffix.lower() not in IGNORED_FILE_EXTENSIONS
        ],
        key=lambda path: natural_sort_key(path.name),
    )


def trim_video_variant_suffix(stem: str) -> str:
    lowered = stem.lower()
    for suffix in WEB_VIDEO_SUFFIXES:
        if lowered.endswith(suffix):
            return stem[: -len(suffix)]
    return stem


def prefer_web_video_variants(paths: list[Path]) -> list[Path]:
    preferred: dict[tuple[str, str], Path] = {}

    for path in paths:
        normalized_stem = trim_video_variant_suffix(path.stem).lower()
        key = (path.suffix.lower(), normalized_stem)
        current = preferred.get(key)
        if current is None:
            preferred[key] = path
            continue

        current_is_web = current.stem != trim_video_variant_suffix(current.stem)
        candidate_is_web = path.stem != trim_video_variant_suffix(path.stem)
        if candidate_is_web and not current_is_web:
            preferred[key] = path

    return sorted(preferred.values(), key=lambda path: natural_sort_key(path.name))


def is_ignored_dir(path: Path) -> bool:
    normalized = path.name.lower()
    return any(keyword.lower() in normalized for keyword in IGNORED_DIR_KEYWORDS)


def looks_like_project_dir(folder: Path) -> bool:
    for folder_name in FOLDER_ALIASES:
        candidate = folder / folder_name
        if candidate.exists() and candidate.is_dir():
            return True

    for path in folder.iterdir():
        if path.is_file() and path.suffix.lower() in PROJECT_EXTENSIONS:
            return True

    return False


def discover_project_dirs() -> list[tuple[str | None, Path]]:
    discovered: list[tuple[str | None, Path]] = []
    top_level_dirs = sorted([path for path in LIBRARY_DIR.iterdir() if path.is_dir()], key=lambda path: natural_sort_key(path.name))

    for path in top_level_dirs:
        if is_ignored_dir(path):
            continue

        if looks_like_project_dir(path):
            discovered.append((None, path))
            continue

        def walk(folder: Path) -> None:
            child_dirs = sorted([child for child in folder.iterdir() if child.is_dir()], key=lambda child: natural_sort_key(child.name))
            for child in child_dirs:
                if is_ignored_dir(child):
                    continue
                if looks_like_project_dir(child):
                    discovered.append((path.name, child))
                    continue
                walk(child)

        walk(path)

    return discovered


def parse_text_metadata(files: list[Path]) -> dict[str, object]:
    for file in files:
        if file.suffix.lower() not in TEXT_EXTENSIONS:
            continue

        try:
            text = file.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            text = file.read_text(encoding="gb18030", errors="ignore")

        cleaned = text.strip()
        if not cleaned:
            continue

        title = None
        summary = None
        custom_labels: list[str] = []

        for line in cleaned.splitlines():
            stripped = line.strip()
            if not stripped:
                continue
            if stripped.startswith(("标题:", "标题：", "项目名:", "项目名：")):
                title = re.split(r"[:：]", stripped, maxsplit=1)[1].strip()
                continue
            if stripped.startswith(("摘要:", "摘要：", "说明:", "说明：")):
                summary = re.split(r"[:：]", stripped, maxsplit=1)[1].strip()
                continue
            if stripped.startswith(("标签:", "标签：")):
                raw = re.split(r"[:：]", stripped, maxsplit=1)[1].strip()
                custom_labels = [item.strip() for item in re.split(r"[，,|/]", raw) if item.strip()]

        if summary:
            text_summary = summary
        else:
            text_summary = re.sub(r"\s+", " ", cleaned).strip()

        return {
            "title": title,
            "summary": text_summary[:240],
            "labels": custom_labels,
        }

    return {}


def score_cover(path: Path) -> tuple[int, list[object]]:
    name = path.stem.lower()
    score = 0
    if "鸟瞰" in path.stem:
        score += 60
    if "总平" in path.stem:
        score += 45
    if "主入口" in path.stem:
        score += 35
    if "沿街" in path.stem:
        score += 25
    if "夜景" in path.stem:
        score += 20
    if "c01" in name:
        score += 18
    if "nk" in name:
        score += 12
    return (-score, get_image_format_priority(path), -path.stat().st_size, natural_sort_key(path.name))


def score_showcase(path: Path, asset_type: str) -> tuple[int, int, list[object]]:
    name = path.stem.lower()
    score = 0

    if "鸟瞰" in path.stem:
        score += 60
    if "主入口" in path.stem:
        score += 46
    if "沿街" in path.stem:
        score += 40
    if "夜景" in path.stem:
        score += 34
    if "总平" in path.stem:
        score += 26
    if "c01" in name:
        score += 20
    if "c02" in name:
        score += 10
    if "局" in path.stem:
        score += 8

    if asset_type == "photo":
        score += 6
    if "微信图片" in path.stem:
        score -= 4
    if "图片" in path.stem:
        score -= 2

    return (-score, get_image_format_priority(path), -path.stat().st_size, natural_sort_key(path.name))


def pick_showcase_images(renderings: list[Path], photos: list[Path]) -> list[Path]:
    ranked_renderings = sorted(renderings, key=lambda path: score_showcase(path, "rendering"))
    ranked_photos = sorted(photos, key=lambda path: score_showcase(path, "photo"))
    return ranked_renderings + ranked_photos


def build_highlights(candidates: list[Path], render_count: int, photo_count: int, doc_count: int, video_count: int) -> list[str]:
    joined_names = " ".join(path.stem for path in candidates)
    highlights: list[str] = []

    for keyword, label in KEYWORD_LABELS:
        if keyword in joined_names and label not in highlights:
            highlights.append(label)

    if render_count:
        highlights.append(f"{render_count} 张效果图")
    if photo_count:
        highlights.append(f"{photo_count} 张真实照片")
    if video_count:
        highlights.append(f"{video_count} 段漫游视频")
    if doc_count:
        highlights.append(f"{doc_count} 份方案文件")

    return highlights[:4]


def build_asset_summary(render_count: int, photo_count: int, doc_count: int, video_count: int) -> str:
    parts = []
    if render_count:
        parts.append(f"{render_count} 张效果图")
    if photo_count:
        parts.append(f"{photo_count} 张实景")
    if video_count:
        parts.append(f"{video_count} 段演示视频")
    if doc_count:
        parts.append(f"{doc_count} 份文档")
    return "、".join(parts)


def normalize_description(project_name: str, description: str | None) -> str | None:
    if project_name in EMPTY_SUMMARY_PROJECTS:
        return ""

    if not description:
        return None

    return description


def build_summary(
    project_name: str,
    category_name: str | None,
    lineage_labels: list[str],
    render_count: int,
    photo_count: int,
    doc_count: int,
    video_count: int,
    description: str | None,
) -> str:
    if description is not None:
        return description

    asset_summary = build_asset_summary(render_count, photo_count, doc_count, video_count)

    if "AI编程" in lineage_labels:
        if "App开发" in lineage_labels:
            return f"{project_name} 为移动端产品方向的界面方案，围绕功能结构、页面组织与视觉风格进行呈现。"
        if "网页设计" in lineage_labels:
            return f"{project_name} 为网页与可视化方向的界面设计，重点展示信息架构、交互层级与视觉表达。"
        if "桌面应用开发" in lineage_labels:
            return f"{project_name} 为桌面效率工具方向的界面方案，展示功能布局、模块关系与操作体验。"
        return f"{project_name} 为数字产品方向的设计研究，展示界面结构、交互逻辑与视觉表达。"

    if category_name == "21年至今我管理的项目":
        if asset_summary:
            return f"{project_name} 收录 {asset_summary}，用于展示项目从方案表达、过程推进到建成落地的完整资料。"
        return f"{project_name} 用于展示项目管理、设计协调与落地推进过程。"

    if category_name == "19-20年我参与的项目":
        if asset_summary:
            return f"{project_name} 收录 {asset_summary}，呈现项目参与阶段的方案表达、空间理解与界面塑造能力。"
        return f"{project_name} 用于展示项目参与阶段的方案表达与空间设计能力。"

    if category_name == "我的作品":
        if "BIM设计稿" in lineage_labels or "BIM设计稿" in project_name:
            return f"{project_name} 聚焦 BIM 建模与空间漫游表达，展示室内及地下空间的组织、路径推演与汇报呈现能力。"
        if "SketchUp" in lineage_labels or project_name == "su设计稿":
            return f"{project_name} 聚焦 SketchUp 建模与体量推敲，展示产业园与厂房类方案的空间判断与模型表达能力。"
        if asset_summary:
            return f"{project_name} 收录 {asset_summary}，用于展示个人研究与设计表达成果。"
        return f"{project_name} 用于展示个人研究、界面表达与设计输出。"

    if asset_summary:
        return f"{project_name} 收录 {asset_summary}，用于展示项目相关成果与过程资料。"
    return f"{project_name} 用于展示相关项目成果与设计输出。"


def build_project(
    project_dir: Path,
    category_name: str | None = None,
    image_variant_registry: dict[str, dict[str, str]] | None = None,
) -> dict[str, object] | None:
    if not project_dir.is_dir():
        return None

    if project_dir.name in IGNORED_PROJECT_NAMES:
        return None

    named_subfolders: dict[str, Path] = {}
    for folder_name, alias in FOLDER_ALIASES.items():
        candidate = project_dir / folder_name
        if candidate.exists() and candidate.is_dir():
            named_subfolders[alias] = candidate

    root_images = list_files(project_dir, IMAGE_EXTENSIONS)
    root_documents = list_files(project_dir, DOCUMENT_EXTENSIONS)

    rendering_images = list_files(named_subfolders["renderings"], IMAGE_EXTENSIONS) if "renderings" in named_subfolders else root_images
    real_photos = list_files(named_subfolders["photos"], IMAGE_EXTENSIONS) if "photos" in named_subfolders else []
    videos = list_files(named_subfolders["videos"], VIDEO_EXTENSIONS) if "videos" in named_subfolders else list_files(project_dir, VIDEO_EXTENSIONS)
    videos = prefer_web_video_variants(videos)
    description_files = list_files(named_subfolders["description"], DOCUMENT_EXTENSIONS) if "description" in named_subfolders else []

    if "renderings" in named_subfolders:
        root_images = []
    if "description" in named_subfolders:
        root_documents = [file for file in root_documents if file.suffix.lower() not in TEXT_EXTENSIONS]
    if "videos" in named_subfolders:
        root_documents = [file for file in root_documents if file.suffix.lower() not in VIDEO_EXTENSIONS]

    document_files = [file for file in description_files if file.suffix.lower() not in TEXT_EXTENSIONS] + [
        file for file in root_documents if file.suffix.lower() not in TEXT_EXTENSIONS
    ]
    documents = document_files
    text_meta = parse_text_metadata(description_files) or parse_text_metadata(root_documents)
    raw_project_name = text_meta.get("title") or project_dir.name
    project_name = PROJECT_TITLE_OVERRIDES.get(raw_project_name, raw_project_name)
    description = normalize_description(raw_project_name, text_meta.get("summary"))
    lineage_labels: list[str] = []
    if category_name:
        category_root = LIBRARY_DIR / category_name
        if project_dir.is_relative_to(category_root):
            lineage_labels = [format_folder_label(part) for part in project_dir.relative_to(category_root).parts[:-1]]

    seen_visual_hashes: set[str] = set()
    rendering_images = dedupe_files(rendering_images, seen_visual_hashes)
    real_photos = dedupe_files(real_photos, seen_visual_hashes)

    total_visuals = len(rendering_images) + len(real_photos) + len(videos)
    if total_visuals == 0 and len(documents) == 0:
        return None

    visual_assets = rendering_images or real_photos
    override_name = PROJECT_COVER_OVERRIDES.get(raw_project_name) or PROJECT_COVER_OVERRIDES.get(project_dir.name)
    override_cover = None
    if override_name:
        override_cover = next((path for path in rendering_images + real_photos if path.name == override_name), None)

    cover = override_cover or (sorted(visual_assets, key=score_cover)[0] if visual_assets else None)
    showcase_images = pick_showcase_images(rendering_images, real_photos)
    if cover and visual_assets:
        showcase_images = [cover] + [path for path in showcase_images if path != cover]
    previews = showcase_images[:3]

    if image_variant_registry is not None:
        register_image_variants(showcase_images, image_variant_registry)

    labels = []
    if rendering_images:
        labels.append("效果图")
    if real_photos:
        labels.append("真实照片")
    if videos:
        labels.append("视频")
    if document_files:
        labels.append("方案文件")
    for lineage_label in lineage_labels:
        if lineage_label not in labels:
            labels.append(lineage_label)
    append_unique(labels, get_ai_programming_labels(project_dir, project_name, lineage_labels))
    for custom_label in text_meta.get("labels", []):
        if custom_label not in labels:
            labels.append(custom_label)

    highlights = build_highlights(
        rendering_images + real_photos + videos + documents,
        len(rendering_images),
        len(real_photos),
        len(document_files),
        len(videos),
    )

    return {
        "slug": make_slug(raw_project_name),
        "category": category_name or "项目归档",
        "categoryLabel": get_category_label(category_name),
        "sourcePath": normalize_path(project_dir),
        "name": project_name,
        "lineage": lineage_labels,
        "summary": build_summary(
            project_name,
            category_name,
            lineage_labels,
            len(rendering_images),
            len(real_photos),
            len(document_files),
            len(videos),
            description,
        ),
        "labels": labels,
        "highlights": highlights,
        "cover": normalize_path(cover) if cover else None,
        "previewImages": [normalize_path(path) for path in previews],
        "showcaseImages": [normalize_path(path) for path in showcase_images],
        "renderings": [normalize_path(path) for path in rendering_images],
        "photos": [normalize_path(path) for path in real_photos],
        "videos": [
            {
                "name": trim_video_variant_suffix(file.stem),
                "path": normalize_path(file),
                "extension": file.suffix.lower().lstrip("."),
            }
            for file in videos
        ],
        "documents": [
            {
                "name": file.stem,
                "path": normalize_path(file),
                "extension": file.suffix.lower().lstrip("."),
            }
            for file in documents
        ],
        "counts": {
            "renderings": len(rendering_images),
            "photos": len(real_photos),
            "videos": len(videos),
            "documents": len(document_files),
        },
    }


def main() -> None:
    ensure_thumbnail_dir()
    project_dirs = discover_project_dirs()
    image_variants: dict[str, dict[str, str]] = {}
    projects = [
        project
        for category_name, path in project_dirs
        if (project := build_project(path, category_name, image_variants))
    ]
    projects.sort(
        key=lambda item: (
            CATEGORY_ORDER.get(str(item["category"]), len(CATEGORY_ORDER)),  # type: ignore[index]
            get_project_sort_priority(str(item["category"]), str(item["name"])),  # type: ignore[index]
            -(item["counts"]["renderings"] + item["counts"]["photos"]),  # type: ignore[index]
            -item["counts"]["documents"],  # type: ignore[index]
            natural_sort_key(str(item["name"])),
        )
    )

    overview = {
        "categoryCount": len({str(project["category"]) for project in projects}),
        "projectCount": len(projects),
        "renderingCount": sum(project["counts"]["renderings"] for project in projects),  # type: ignore[index]
        "photoCount": sum(project["counts"]["photos"] for project in projects),  # type: ignore[index]
        "videoCount": sum(project["counts"]["videos"] for project in projects),  # type: ignore[index]
        "documentCount": sum(project["counts"]["documents"] for project in projects),  # type: ignore[index]
    }

    categories = [
        {
            "name": category_name,
            "label": get_category_label(category_name),
            "count": len([project for project in projects if project["category"] == category_name]),
        }
        for category_name in sorted(
            {str(project["category"]) for project in projects},
            key=lambda name: (CATEGORY_ORDER.get(name, len(CATEGORY_ORDER)), natural_sort_key(name)),
        )
    ]

    payload = {
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "overview": overview,
        "categories": categories,
        "imageVariants": image_variants,
        "projects": projects,
    }

    OUTPUT_FILE.write_text(
        "window.portfolioData = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"Generated {OUTPUT_FILE.name} with {len(projects)} projects.")


if __name__ == "__main__":
    main()
