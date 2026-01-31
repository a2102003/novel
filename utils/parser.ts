import { Chapter } from '../types';

export const parseNovelContent = (fullText: string): Chapter[] => {
  // Enhanced regex to support:
  // 1. Chinese chapters: "第1章", "第一回", etc.
  // 2. English chapters: "Chapter 1", "chapter 10", etc.
  // 3. Markdown headers: "# Title", "## Title"
  // 4. Simple numbered chapters often found in txts: "1. ", "2. ", "10、" (requires start of line)
  // Group 2 is the full matched title line.
  
  const chapterRegex = /(^|\n)\s*((第[0-9零一二三四五六七八九十百千]+[章回节卷].*)|(Chapter\s+\d+.*)|(#{1,2}\s+.*)|(^|\n)(\d+[\.、]\s+.*))/gi;
  
  const matches = [...fullText.matchAll(chapterRegex)];
  
  if (matches.length === 0) {
    // No chapters found, treat entire file as one chapter
    return [{
      index: 0,
      title: "全文",
      content: fullText.trim()
    }];
  }

  const chapters: Chapter[] = [];
  
  // Handle preamble (content before first chapter)
  if (matches[0].index && matches[0].index > 0) {
    const preamble = fullText.substring(0, matches[0].index).trim();
    if (preamble) {
      chapters.push({
        index: 0,
        title: "前言 / 序章",
        content: preamble
      });
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    let title = match[2].trim();
    
    // Clean Markdown headers (remove leading #)
    title = title.replace(/^#+\s*/, '');
    
    // Clean leading newlines if match included them
    title = title.trim();

    const startIndex = (match.index || 0) + match[0].length;
    const endIndex = i < matches.length - 1 ? matches[i + 1].index : fullText.length;
    
    const content = fullText.substring(startIndex, endIndex).trim();
    
    // Ensure content isn't empty or just whitespace (sometimes regex matches false positives)
    if (content.length > 0 || i < matches.length - 1) {
        chapters.push({
          index: chapters.length, // use length to keep sequence
          title: title,
          content: content
        });
    }
  }

  return chapters;
};