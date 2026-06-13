export function extractXmlTag(block: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = block.match(re);
  return match?.[1]?.trim();
}

export interface RssItemFields {
  title: string;
  link: string;
  guid: string;
  description: string;
  pubDate: string;
  region: string;
  category: string;
}

export function parseRssItems(xml: string): RssItemFields[] {
  const items: RssItemFields[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let match = itemRe.exec(xml);

  while (match) {
    const block = match[1];
    items.push({
      title: extractXmlTag(block, "title") ?? "",
      link: extractXmlTag(block, "link") ?? "",
      guid: extractXmlTag(block, "guid") ?? "",
      description: extractXmlTag(block, "description") ?? "",
      pubDate: extractXmlTag(block, "pubDate") ?? "",
      region: extractXmlTag(block, "region") ?? "",
      category: extractXmlTag(block, "category") ?? "",
    });
    match = itemRe.exec(xml);
  }

  return items;
}

export function externalIdFromUrl(url: string): string {
  const slug = url.split("/").filter(Boolean).pop();
  return slug ?? url;
}
