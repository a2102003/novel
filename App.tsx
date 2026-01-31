import React, { useState, useEffect, useCallback } from 'react';
import { Book, Chapter, ReaderSettings, ThemeMode } from './types';
import { parseNovelContent } from './utils/parser';
import Library from './components/Library';
import Reader from './components/Reader';
import { Settings, Moon, Sun, Coffee, Type, Minus, Plus } from 'lucide-react';

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  
  const [isLibraryOpen, setLibraryOpen] = useState(true);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const [settings, setSettings] = useState<ReaderSettings>({
    theme: ThemeMode.LIGHT,
    fontSize: 18,
    lineHeight: 1.8,
    width: 800
  });

  // Handle Book Upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newBooks: Book[] = [];
    const files = Array.from(e.target.files) as File[];

    // Sort files by name to ensure order if they are numbered (001.txt, 002.txt)
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    for (const file of files) {
      const lowerName = file.name.toLowerCase();
      const isText = file.type === 'text/plain' || lowerName.endsWith('.txt');
      const isMarkdown = lowerName.endsWith('.md') || lowerName.endsWith('.markdown');

      if (isText || isMarkdown) {
        try {
          const text = await file.text();
          const chapters = parseNovelContent(text);
          
          const book: Book = {
            id: crypto.randomUUID(),
            title: file.name.replace(/\.(txt|md|markdown)$/i, ''),
            fileName: file.name,
            content: text,
            chapters: chapters,
            lastReadChapterIndex: 0,
            progress: 0
          };
          newBooks.push(book);
        } catch (err) {
          console.error(`Failed to read file ${file.name}`, err);
        }
      }
    }

    if (newBooks.length > 0) {
      setBooks(prev => [...prev, ...newBooks]);
      // If no book selected, select the first one
      if (!currentBookId) {
        setCurrentBookId(newBooks[0].id);
        setCurrentChapterIndex(0);
      }
    }
  };

  const currentBook = books.find(b => b.id === currentBookId);
  const currentChapter = currentBook?.chapters[currentChapterIndex];

  // Navigation Handlers
  const handleNextChapter = () => {
    if (currentBook && currentChapterIndex < currentBook.chapters.length - 1) {
      setCurrentChapterIndex(prev => prev + 1);
    }
  };

  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(prev => prev - 1);
    }
  };

  const toggleBook = (id: string) => {
      // If clicking the current book in library, maybe just keep it.
      // If clicking a different one, switch and reset chapter to saved progress (todo) or 0
      if (id !== currentBookId) {
        setCurrentBookId(id);
        setCurrentChapterIndex(0);
      } else {
        // If clicking back button (empty id passed from Library component logic)
        if(id === '') setCurrentBookId(null);
      }
  };

  // Theme application
  useEffect(() => {
    // Apply background color to body to prevent white flashes
    const bodyColor = 
      settings.theme === ThemeMode.DARK ? '#1a1a1a' : 
      settings.theme === ThemeMode.SEPIA ? '#f4ecd8' : '#ffffff';
    document.body.style.backgroundColor = bodyColor;
  }, [settings.theme]);

  // Settings Panel Component (Inline for simplicity as it shares state tightly)
  const SettingsPanel = () => {
    if (!isSettingsOpen) return null;
    return (
      <div className={`pointer-events-auto absolute top-16 right-4 p-4 rounded-xl shadow-xl border z-50 w-64 backdrop-blur-md ${
        settings.theme === ThemeMode.DARK 
          ? 'bg-neutral-800/90 border-neutral-700 text-gray-200' 
          : 'bg-white/90 border-gray-200 text-gray-800'
      }`}>
        <div className="space-y-4">
          <div>
            <div className="text-xs font-bold uppercase opacity-50 mb-2">主题</div>
            <div className="flex gap-2">
              <button 
                onClick={() => setSettings(s => ({...s, theme: ThemeMode.LIGHT}))}
                className={`flex-1 p-2 rounded border flex justify-center ${settings.theme === ThemeMode.LIGHT ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-300 bg-white text-black'}`}
              >
                <Sun size={16} />
              </button>
              <button 
                onClick={() => setSettings(s => ({...s, theme: ThemeMode.SEPIA}))}
                className={`flex-1 p-2 rounded border flex justify-center ${settings.theme === ThemeMode.SEPIA ? 'ring-2 ring-amber-500 border-transparent' : 'border-[#d3c4b1] bg-[#f4ecd8] text-[#5b4636]'}`}
              >
                <Coffee size={16} />
              </button>
              <button 
                onClick={() => setSettings(s => ({...s, theme: ThemeMode.DARK}))}
                className={`flex-1 p-2 rounded border flex justify-center ${settings.theme === ThemeMode.DARK ? 'ring-2 ring-purple-500 border-transparent' : 'border-neutral-700 bg-[#1a1a1a] text-gray-300'}`}
              >
                <Moon size={16} />
              </button>
            </div>
          </div>
          
          <div>
            <div className="text-xs font-bold uppercase opacity-50 mb-2">字号 ({settings.fontSize}px)</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSettings(s => ({...s, fontSize: Math.max(12, s.fontSize - 1)}))} className="p-1 rounded hover:bg-black/10"><Minus size={16} /></button>
              <input 
                type="range" min="12" max="32" 
                value={settings.fontSize} 
                onChange={(e) => setSettings(s => ({...s, fontSize: parseInt(e.target.value)}))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <button onClick={() => setSettings(s => ({...s, fontSize: Math.min(32, s.fontSize + 1)}))} className="p-1 rounded hover:bg-black/10"><Plus size={16} /></button>
            </div>
          </div>

          <div>
             <div className="text-xs font-bold uppercase opacity-50 mb-2">阅读宽度</div>
             <div className="flex items-center gap-2">
               <button onClick={() => setSettings(s => ({...s, width: Math.max(500, s.width - 50)}))} className="p-1 rounded hover:bg-black/10"><Minus size={16} /></button>
               <div className="flex-1 text-center text-xs">{settings.width}px</div>
               <button onClick={() => setSettings(s => ({...s, width: Math.min(1200, s.width + 50)}))} className="p-1 rounded hover:bg-black/10"><Plus size={16} /></button>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex h-screen w-full relative overflow-hidden transition-colors duration-300 ${
      settings.theme === ThemeMode.DARK ? 'bg-[#1a1a1a]' : settings.theme === ThemeMode.SEPIA ? 'bg-[#f4ecd8]' : 'bg-white'
    }`}>
      
      {/* Sidebar Library */}
      <Library 
        books={books}
        currentBookId={currentBookId}
        currentChapterIndex={currentChapterIndex}
        isOpen={isLibraryOpen}
        theme={settings.theme}
        onSelectBook={toggleBook}
        onSelectChapter={setCurrentChapterIndex}
        onUpload={handleUpload}
        onToggle={() => setLibraryOpen(!isLibraryOpen)}
        onDeleteBook={(id) => {
          setBooks(prev => prev.filter(b => b.id !== id));
          if (currentBookId === id) setCurrentBookId(null);
        }}
      />

      {/* Main Reader Area */}
      <div className={`flex-1 relative flex flex-col transition-all duration-300 ${isLibraryOpen ? 'md:ml-80' : ''}`}>
        
        {/* Top Controls Overlay */}
        <div className={`absolute top-0 right-0 left-0 p-4 flex justify-end items-center gap-2 z-30 pointer-events-none`}>
          <div className="pointer-events-auto flex gap-2">
            <button 
              onClick={() => setSettingsOpen(!isSettingsOpen)}
              className={`p-2 rounded-full shadow-md backdrop-blur-sm transition-colors cursor-pointer ${
                settings.theme === ThemeMode.DARK ? 'bg-black/20 text-white hover:bg-black/40' : 'bg-white/50 text-black hover:bg-white/80'
              }`}
            >
              <Type size={20} />
            </button>
          </div>
          <SettingsPanel />
        </div>

        <Reader 
          chapter={currentChapter} 
          settings={settings}
          onNextChapter={handleNextChapter}
          onPrevChapter={handlePrevChapter}
          hasPrev={currentChapterIndex > 0}
          hasNext={!!currentBook && currentChapterIndex < currentBook.chapters.length - 1}
        />
      </div>
    </div>
  );
}

export default App;