import React, { useState, useEffect } from 'react';
import { Book, ReaderSettings, ThemeMode } from './types';
import { parseNovelContent } from './utils/parser';
import { db } from './utils/db'; // Import the database utility
import Library from './components/Library';
import Reader from './components/Reader';
import { Moon, Sun, Coffee, Type, Minus, Plus, UploadCloud } from 'lucide-react';

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  
  const [isLibraryOpen, setLibraryOpen] = useState(true);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Load books from Server AND DB on startup
  useEffect(() => {
    const initBooks = async () => {
      let allBooks: Book[] = [];

      // 1. Fetch Remote Books (Static files from /public/novels)
      try {
        const res = await fetch('/novels/manifest.json');
        if (res.ok) {
          const manifest = await res.json();
          
          const remotePromises = manifest.map(async (item: { title: string, file: string, visibleChapters?: number }) => {
             try {
               const textRes = await fetch(`/novels/${encodeURIComponent(item.file)}`);
               if (!textRes.ok) throw new Error("File not found");
               const text = await textRes.text();
               let chapters = parseNovelContent(text);

               // Apply chapter limit if specified in manifest
               if (typeof item.visibleChapters === 'number' && item.visibleChapters > 0) {
                 chapters = chapters.slice(0, item.visibleChapters);
               }

               return {
                 id: `static-${item.file}`, // Unique ID for static files
                 title: item.title,
                 fileName: item.file,
                 content: text,
                 chapters: chapters,
                 lastReadChapterIndex: 0,
                 progress: 0,
                 isStatic: true
               } as Book;
             } catch (e) {
               console.error(`Failed to load remote book: ${item.title}`, e);
               return null;
             }
          });
          
          const remoteResults = await Promise.all(remotePromises);
          const validRemoteBooks = remoteResults.filter(b => b !== null) as Book[];
          allBooks = [...allBooks, ...validRemoteBooks];
        }
      } catch (e) {
        console.warn("Could not load remote manifest", e);
      }

      // 2. Fetch Local Books (User uploaded via drag & drop)
      try {
        const localBooks = await db.getAllBooks();
        // Merge lists (Remote first, then Local)
        allBooks = [...allBooks, ...localBooks];
      } catch (error) {
        console.error("Failed to load local books:", error);
      }

      setBooks(allBooks);
      
      // If no book selected, and we have books, maybe select one? 
      // Or just leave it null to show welcome screen.
    };

    initBooks();
  }, []);

  const [settings, setSettings] = useState<ReaderSettings>({
    theme: ThemeMode.LIGHT,
    fontSize: 18,
    lineHeight: 1.8,
    width: 800
  });

  // Reusable function to process file list
  const processFiles = async (files: File[]) => {
    const newBooks: Book[] = [];

    // Sort files by name
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
            progress: 0,
            isStatic: false
          };
          
          // Save to DB immediately
          await db.saveBook(book);
          newBooks.push(book);
        } catch (err) {
          console.error(`Failed to read file ${file.name}`, err);
        }
      }
    }

    if (newBooks.length > 0) {
      setBooks(prev => [...prev, ...newBooks]);
      // If no book currently selected, select the first new one
      if (!currentBookId) {
        setCurrentBookId(newBooks[0].id);
        setCurrentChapterIndex(0);
      }
    }
  };

  // Handle Input Change Upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files) as File[];
    await processFiles(files);
    e.target.value = '';
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      await processFiles(files);
    }
  };

  const currentBook = books.find(b => b.id === currentBookId);
  const currentChapter = currentBook?.chapters[currentChapterIndex];

  // Helper to update progress state
  const updateChapter = (newIndex: number) => {
    setCurrentChapterIndex(newIndex);
    
    if (currentBookId) {
      // Only save progress to DB if it's a local book? 
      // Actually we can try to save progress for server books too in DB if we key by ID.
      // But for simplicity in this version, let's just update local state for all,
      // and only persist to DB if the book exists in DB.
      
      // Update UI state
      setBooks(prevBooks => prevBooks.map(b => {
        if (b.id === currentBookId) {
          return { ...b, lastReadChapterIndex: newIndex };
        }
        return b;
      }));

      // Try to persist progress. 
      // For static books, we might need a separate store "reading_progress" but for now
      // let's just try to update. db.updateProgress checks if record exists.
      // If it's a static book, it won't be in 'books' store unless we save it there.
      // To keep it simple: Progress for static books is currently session-only in this implementation
      // unless we clone them to DB. Let's stick to session-only for static books to avoid duplication logic complexity.
      const targetBook = books.find(b => b.id === currentBookId);
      if (targetBook && !targetBook.isStatic) {
         db.updateProgress(currentBookId, newIndex);
      }
    }
  };

  // Navigation Handlers
  const handleNextChapter = () => {
    if (currentBook && currentChapterIndex < currentBook.chapters.length - 1) {
      updateChapter(currentChapterIndex + 1);
    }
  };

  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      updateChapter(currentChapterIndex - 1);
    }
  };

  const toggleBook = (id: string) => {
      if (id !== currentBookId) {
        const targetBook = books.find(b => b.id === id);
        if (targetBook) {
          setCurrentBookId(id);
          setCurrentChapterIndex(targetBook.lastReadChapterIndex || 0);
          if (window.innerWidth < 768) {
            setLibraryOpen(false);
          }
        } else if (id === '') {
          setCurrentBookId(null);
        }
      }
  };

  const handleDeleteBook = async (id: string) => {
    // Only allow deleting local books
    const book = books.find(b => b.id === id);
    if (book && book.isStatic) {
      alert("这是网站内置书籍，无法删除。");
      return;
    }

    await db.deleteBook(id);
    setBooks(prev => prev.filter(b => b.id !== id));
    if (currentBookId === id) setCurrentBookId(null);
  };

  // Theme application
  useEffect(() => {
    const bodyColor = 
      settings.theme === ThemeMode.DARK ? '#1a1a1a' : 
      settings.theme === ThemeMode.SEPIA ? '#f4ecd8' : '#ffffff';
    document.body.style.backgroundColor = bodyColor;
  }, [settings.theme]);

  // Settings Panel Component
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
    <div 
      className={`flex h-screen w-full relative overflow-hidden transition-colors duration-300 ${
        settings.theme === ThemeMode.DARK ? 'bg-[#1a1a1a]' : settings.theme === ThemeMode.SEPIA ? 'bg-[#f4ecd8]' : 'bg-white'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-500/20 backdrop-blur-sm border-4 border-blue-500 border-dashed m-4 rounded-xl flex flex-col items-center justify-center text-blue-600 pointer-events-none">
          <UploadCloud size={64} className="mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold">释放以导入小说</h2>
        </div>
      )}

      {/* Sidebar Library */}
      <Library 
        books={books}
        currentBookId={currentBookId}
        currentChapterIndex={currentChapterIndex}
        isOpen={isLibraryOpen}
        theme={settings.theme}
        onSelectBook={toggleBook}
        onSelectChapter={updateChapter}
        onUpload={handleUpload}
        onToggle={() => setLibraryOpen(!isLibraryOpen)}
        onDeleteBook={handleDeleteBook}
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