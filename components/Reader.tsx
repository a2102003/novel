import React, { useEffect, useRef } from 'react';
import { Chapter, ThemeMode, ReaderSettings } from '../types';

interface ReaderProps {
  chapter: Chapter | undefined;
  settings: ReaderSettings;
  onNextChapter: () => void;
  onPrevChapter: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

const Reader: React.FC<ReaderProps> = ({ 
  chapter, 
  settings, 
  onNextChapter, 
  onPrevChapter,
  hasPrev,
  hasNext 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to top when chapter changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [chapter?.index]);

  // Styles based on theme
  const getThemeStyles = () => {
    switch (settings.theme) {
      case ThemeMode.DARK:
        return {
          container: 'bg-[#1a1a1a]',
          text: 'text-[#bfbfbf]',
          selection: 'selection:bg-blue-900 selection:text-white'
        };
      case ThemeMode.SEPIA:
        return {
          container: 'bg-[#f4ecd8]',
          text: 'text-[#5b4636]',
          selection: 'selection:bg-[#d3c4b1] selection:text-[#3e2f24]'
        };
      default:
        return {
          container: 'bg-white',
          text: 'text-gray-800',
          selection: 'selection:bg-blue-100 selection:text-blue-900'
        };
    }
  };

  const styles = getThemeStyles();

  if (!chapter) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center h-screen ${styles.container} ${styles.text}`}>
        <div className="text-center opacity-60">
          <h1 className="text-3xl font-serif mb-4">ZenReader</h1>
          <p>请从左侧选择一本书开始阅读</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className={`flex-1 h-screen overflow-y-auto transition-colors duration-300 ${styles.container} ${styles.text} ${styles.selection}`}
    >
      <div 
        className="mx-auto min-h-screen flex flex-col px-6 py-12 md:py-20"
        style={{ 
          maxWidth: `${settings.width}px`,
        }}
      >
        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-12 text-center opacity-90">
          {chapter.title}
        </h1>
        
        <div 
          className="font-serif whitespace-pre-wrap text-justify leading-relaxed opacity-95"
          style={{ 
            fontSize: `${settings.fontSize}px`, 
            lineHeight: settings.lineHeight 
          }}
        >
          {chapter.content}
        </div>

        <div className="mt-20 flex justify-between items-center opacity-60 text-sm font-sans border-t border-current pt-8 border-opacity-20">
          <button 
            onClick={onPrevChapter}
            disabled={!hasPrev}
            className={`px-4 py-2 rounded hover:bg-black/5 disabled:opacity-30 transition-colors`}
          >
            上一章
          </button>
          
          <span>{chapter.title}</span>

          <button 
            onClick={onNextChapter}
            disabled={!hasNext}
            className={`px-4 py-2 rounded hover:bg-black/5 disabled:opacity-30 transition-colors`}
          >
            下一章
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reader;