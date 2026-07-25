#!/usr/bin/env python3
"""Scan Markdown for publish-time AI residue and public-writing smells.

This is a deliberately small, dependency-free CI gate. It is not an AI detector.
It catches mechanical artifacts, placeholders, leaked citation tokens, and a short
list of style patterns that should be reviewed before public Markdown ships.
"""
from __future__ import annotations

import argparse
import fnmatch
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Sequence


@dataclass
class Finding:
    severity: str  # error | warning
    category: str
    path: Path
    line: int
    message: str
    excerpt: str = ""


def shell(cmd: Sequence[str]) -> str:
    return subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL)


def parse_scalar(value: str):
    value = value.strip()
    if not value:
        return ""
    if value.startswith("[") and value.endswith("]"):
        inner = value[1:-1].strip()
        if not inner:
            return []
        return [item.strip().strip('"\'') for item in inner.split(",")]
    if value.lower() in {"true", "false"}:
        return value.lower() == "true"
    return value.strip('"\'')


def load_config(path: Path) -> Dict[str, object]:
    cfg: Dict[str, object] = {
        "mode": "docs",
        "paths": ["**/*.md"],
        "exclude": [
            "node_modules/**",
            "dist/**",
            "build/**",
            "public/**",
            "coverage/**",
            ".git/**",
        ],
        "fail_on": ["chatbot_artifacts", "citation_leaks", "placeholders", "ai_url_params"],
        "warn_on": ["ai_vocabulary", "em_dash_density", "decorative_bold", "generated_scaffolding", "manifesto_cadence"],
        "private_names": [],
        "max_warnings": 0,
    }
    if not path.exists():
        return cfg

    current_key = None
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.split("#", 1)[0].rstrip()
        if not line.strip():
            continue
        if not line.startswith(" ") and ":" in line:
            key, value = line.split(":", 1)
            key = key.strip()
            value = value.strip()
            current_key = key
            if value:
                cfg[key] = parse_scalar(value)
            else:
                cfg[key] = []
            continue
        if current_key and line.lstrip().startswith("- "):
            item = line.lstrip()[2:].strip().strip('"\'')
            if not isinstance(cfg.get(current_key), list):
                cfg[current_key] = []
            cfg[current_key].append(item)
    return cfg


def tracked_markdown(root: Path) -> List[Path]:
    try:
        files = shell(["git", "ls-files", "*.md", "*.markdown", "*.mdx"]).splitlines()
    except Exception:
        files = [str(p.relative_to(root)) for p in root.rglob("*.md") if ".git" not in p.parts]
    return [Path(f) for f in files]


def matches_any(path: Path, patterns: Iterable[str]) -> bool:
    s = path.as_posix()
    for pat in patterns:
        variants = [pat]
        if "**/" in pat:
            variants.append(pat.replace("**/", ""))
        if any(fnmatch.fnmatch(s, v) or fnmatch.fnmatch("/" + s, v) for v in variants):
            return True
    return False


def line_number(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1


def excerpt_at(text: str, line: int) -> str:
    lines = text.splitlines()
    if 1 <= line <= len(lines):
        return lines[line - 1].strip()[:220]
    return ""


def add_regex_findings(findings: List[Finding], *, text: str, path: Path, severity: str, category: str, patterns: Sequence[tuple[str, str]], flags=re.I):
    for pattern, message in patterns:
        for m in re.finditer(pattern, text, flags):
            ln = line_number(text, m.start())
            findings.append(Finding(severity, category, path, ln, message, excerpt_at(text, ln)))


CHATBOT_PATTERNS = [
    (r"\bAs an AI(?: language model)?\b", "chatbot self-reference"),
    (r"\bI hope this helps!?\b", "chatbot closing"),
    (r"\bCertainly!\b", "chatbot affirmation"),
    (r"\bAbsolutely!\b", "chatbot affirmation"),
    (r"\bGreat question!?\b", "chatbot prompt praise"),
    (r"\bFeel free to (?:reach out|ask)\b", "chatbot support closing"),
    (r"\bLet me know if you need anything else\b", "chatbot support closing"),
]

CITATION_PATTERNS = [
    (r"contentReference\[[^\]]+\]\{[^}]+\}", "leaked chat citation token"),
    (r"\bcite(?:turn|ref)\d+\w*\b", "leaked chat citation token"),
    (r"\boai_citation\b", "leaked chat citation token"),
    (r"\[attached_file:\d+\]", "leaked attachment marker"),
    (r"\bgrok_card\b", "leaked chat card marker"),
]

PLACEHOLDER_PATTERNS = [
    (r"\[(?:INSERT|Insert|TODO|Todo|Your|Add|Enter|Describe|Specify|Choose)[^\]]+\]", "unfilled placeholder"),
    (r"\b\d{4}-XX-XX\b", "placeholder date"),
    (r"<!--\s*(?:TODO|todo|add|fill in|insert|describe)[\s\S]*?-->", "unfilled HTML comment placeholder"),
]

AI_URL_PATTERNS = [
    (r"[?&](?:utm_source|referrer)=(?:chatgpt\.com|copilot\.com|openai|claude\.ai|perplexity\.ai|grok\.com)\b", "AI-tool tracking parameter in URL"),
]

AI_VOCAB = [
    "delve", "tapestry", "realm", "paradigm", "embark", "beacon", "testament to",
    "cutting-edge", "leverage", "pivotal", "underscores", "meticulous", "seamless",
    "game-changer", "utilize", "nestled", "vibrant", "thriving", "showcasing",
    "deep dive", "dive into", "unpack", "intricate", "ever-evolving", "daunting",
    "holistic", "actionable", "impactful", "learnings", "at its core", "synergy",
    "in order to", "due to the fact that", "serves as", "boasts", "moreover",
    "furthermore", "in conclusion", "at the end of the day", "it's worth noting",
]

DOCS_ALLOWED = {"robust", "comprehensive", "seamless", "ecosystem", "leverage", "facilitate", "underpin", "streamline"}

SCAFFOLDING_HEADINGS = [
    "the inversion", "the invisible part", "software has a worldview", "design rules",
    "possible shape", "a small project seed", "key takeaways", "conclusion", "overview",
]

MANIFESTO_PATTERNS = [
    (r"\bnot just [^.\n]+\.\s+It is\b", "tidy 'not just / it is' manifesto cadence"),
    (r"\bThis is not [^.\n]+\.\s+It is\b", "tidy 'not / it is' manifesto cadence"),
    (r"\bAt its core\b", "inflated significance framing"),
]


def scan_file(path: Path, text: str, cfg: Dict[str, object]) -> List[Finding]:
    mode = str(cfg.get("mode", "docs"))
    fail_on = set(cfg.get("fail_on", []) or [])
    warn_on = set(cfg.get("warn_on", []) or [])
    findings: List[Finding] = []

    def sev(category: str, default="warning") -> str | None:
        if category in fail_on:
            return "error"
        if category in warn_on:
            return "warning"
        return None

    for category, patterns in [
        ("chatbot_artifacts", CHATBOT_PATTERNS),
        ("citation_leaks", CITATION_PATTERNS),
        ("placeholders", PLACEHOLDER_PATTERNS),
        ("ai_url_params", AI_URL_PATTERNS),
    ]:
        s = sev(category, "error")
        if s:
            add_regex_findings(findings, text=text, path=path, severity=s, category=category, patterns=patterns)

    if private_names := (cfg.get("private_names", []) or []):
        s = sev("private_name_leaks", "error")
        if s:
            for name in private_names:
                if not name:
                    continue
                pat = r"\b" + re.escape(str(name)) + r"\b"
                add_regex_findings(findings, text=text, path=path, severity=s, category="private_name_leaks", patterns=[(pat, f"private name leak: {name}")], flags=0)

    if s := sev("generated_scaffolding"):
        for i, line in enumerate(text.splitlines(), 1):
            m = re.match(r"^#{1,6}\s+(.+?)\s*$", line)
            if not m:
                continue
            heading = re.sub(r"[#*`_]+", "", m.group(1)).strip().lower()
            if heading in SCAFFOLDING_HEADINGS:
                findings.append(Finding(s, "generated_scaffolding", path, i, f"generic generated-feeling heading: {m.group(1).strip()}", line.strip()))

    if s := sev("ai_vocabulary"):
        vocab = [w for w in AI_VOCAB if not (mode == "docs" and w in DOCS_ALLOWED)]
        for word in vocab:
            pat = r"\b" + re.escape(word) + r"(?:s|ed|ing|ly)?\b"
            for m in re.finditer(pat, text, re.I):
                ln = line_number(text, m.start())
                findings.append(Finding(s, "ai_vocabulary", path, ln, f"review AI-prone phrase: {m.group(0)}", excerpt_at(text, ln)))

    if (s := sev("em_dash_density")) and "—" in text:
        words = max(1, len(re.findall(r"\w+", text)))
        count = text.count("—")
        if count > max(1, words // 1000):
            ln = line_number(text, text.index("—"))
            findings.append(Finding(s, "em_dash_density", path, ln, f"high em-dash density: {count} em dashes in {words} words", excerpt_at(text, ln)))

    if s := sev("decorative_bold"):
        bolds = list(re.finditer(r"\*\*([^*\n]{3,80})\*\*", text))
        if mode == "garden":
            threshold = 0
        else:
            threshold = 8
        if len(bolds) > threshold:
            first = bolds[0]
            ln = line_number(text, first.start())
            findings.append(Finding(s, "decorative_bold", path, ln, f"review bold usage: {len(bolds)} bold spans", excerpt_at(text, ln)))

    if s := sev("manifesto_cadence"):
        add_regex_findings(findings, text=text, path=path, severity=s, category="manifesto_cadence", patterns=MANIFESTO_PATTERNS)

    return findings


def gh_escape(value: str) -> str:
    return value.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A").replace(":", "%3A").replace(",", "%2C")


def emit(f: Finding, github: bool):
    loc = f"{f.path.as_posix()}:{f.line}"
    text = f"[{f.category}] {f.message}"
    if f.excerpt:
        text += f" | {f.excerpt}"
    if github:
        print(f"::{f.severity} file={gh_escape(f.path.as_posix())},line={f.line},title={gh_escape(f.category)}::{gh_escape(text)}")
    else:
        print(f"{f.severity.upper()} {loc} {text}")


def main(argv: Sequence[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default=".ai-prune.yml")
    ap.add_argument("--github-annotations", action="store_true")
    ap.add_argument("--changed", action="store_true", help="scan changed Markdown files only when possible")
    args = ap.parse_args(argv)

    root = Path.cwd()
    cfg = load_config(root / args.config)
    paths = cfg.get("paths", ["**/*.md"]) or ["**/*.md"]
    excludes = cfg.get("exclude", []) or []

    candidates = tracked_markdown(root)
    files = [p for p in candidates if matches_any(p, paths) and not matches_any(p, excludes)]

    all_findings: List[Finding] = []
    for rel in files:
        full = root / rel
        if not full.exists():
            continue
        try:
            text = full.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        all_findings.extend(scan_file(rel, text, cfg))

    errors = [f for f in all_findings if f.severity == "error"]
    warnings = [f for f in all_findings if f.severity == "warning"]
    max_warnings = int(cfg.get("max_warnings", 0) or 0)

    for f in all_findings:
        emit(f, args.github_annotations or os.getenv("GITHUB_ACTIONS") == "true")

    print(f"AI-prune scanned {len(files)} Markdown files: {len(errors)} errors, {len(warnings)} warnings")
    if errors:
        return 1
    if max_warnings and len(warnings) > max_warnings:
        print(f"Warning budget exceeded: {len(warnings)} > {max_warnings}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
