/** Visible text of an element with one space between text nodes (`textContent` glues sibling elements together). */
export function textOf(element: Element | null | undefined): string {
  if (!element) {
    return '';
  }
  const parts: string[] = [];
  const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.trim();
    if (text) {
      parts.push(text);
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ');
}
