"""Verify the basic structure and relative resource links of the lab site."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import sys


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.ids = set()
        self.links = []
        self.errors = []
        self.has_doctype = False
        self.language = ""
        self.headings = 0
        self.stylesheets = 0
        self.feed(path.read_text(encoding="utf-8"))
        self.close()

    def handle_decl(self, declaration):
        self.has_doctype |= declaration.casefold() == "doctype html"

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "html":
            self.language = attributes.get("lang", "")
        if tag == "h1":
            self.headings += 1

        element_id = attributes.get("id")
        if element_id:
            if element_id in self.ids:
                self.errors.append(f"duplicate id {element_id!r}")
            self.ids.add(element_id)

        if tag == "link" and attributes.get("rel") == "stylesheet":
            self.stylesheets += 1
        for attribute in ("href", "src"):
            if attribute in attributes:
                self.links.append((self.getpos()[0], attributes[attribute] or ""))


def check_link(page, line, link, site_root, pages):
    url = urlsplit(link)
    if url.scheme in {"http", "https", "mailto", "tel"} or url.netloc:
        return None
    if not link or url.scheme or url.path.startswith("/"):
        return f"line {line}: use a non-empty relative link, got {link!r}"

    target = page.path
    if url.path:
        target = (page.path.parent / unquote(url.path)).resolve()
    if not target.is_relative_to(site_root):
        return f"line {line}: link leaves the publishing directory: {link!r}"
    if target.is_dir():
        target /= "index.html"
    if not target.is_file():
        return f"line {line}: missing target {link!r}"
    if url.fragment and target.suffix == ".html":
        if target not in pages:
            pages[target] = Page(target)
        if unquote(url.fragment) not in pages[target].ids:
            return f"line {line}: missing anchor {link!r}"
    return None


def main():
    site_root = Path(sys.argv[1]).resolve()
    directory = site_root / "lab6"
    paths = sorted(directory.rglob("*.html"))
    if directory / "index.html" not in paths:
        print("Missing lab6/index.html", file=sys.stderr)
        return 1

    pages = {path: Page(path) for path in paths}
    errors_found = False
    for path in paths:
        page = pages[path]
        if not page.has_doctype or page.language != "ru":
            page.errors.append('expected HTML5 doctype and lang="ru"')
        if page.headings != 1 or not page.stylesheets:
            page.errors.append("expected one h1 and a linked stylesheet")
        for line, link in page.links:
            message = check_link(page, line, link, site_root, pages)
            if message:
                page.errors.append(message)
        for message in page.errors:
            print(f"{path.relative_to(site_root)}: {message}", file=sys.stderr)
        errors_found |= bool(page.errors)

    if errors_found:
        return 1
    print(f"Checked {len(paths)} HTML page(s): all local files and anchors exist.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
