import React from 'react';
import { Book, Chapter, ThemeMode } from '../types';
import { BookOpen, FileText, Upload, Trash2, Library as LibraryIcon, Menu, FolderUp, FileUp } from 'lucide-react';

interface LibraryProps {
  books: Book[];
  currentBookId: string | null;
  currentChapterIndex: number;
  isOpen: boolean;
  theme: ThemeMode;
  onSelectBook: (id: string) => void;
  onSelectChapter: (index: number) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggle: () => void;
  onDeleteBook: (id: string) => void;
}

const Library: React.FC<LibraryProps> = ({
  books,
  currentBookId,
  currentChapterIndex,
  isOpen,
  theme,
  onSelectBook,
  onSelectChapter,
  onUpload,
  onToggle,
  onDeleteBook
}) => {
  const currentBook = books.find(b => b.id === currentBookId);

  // Theme-based styles
  const bgClass = theme === ThemeMode.DARK ? 'bg-neutral-900 border-neutral-800' : theme === ThemeMode.SEPIA ? 'bg-[#eaddcf] border-[#d3c4b1]' : 'bg-white border-gray-200';
  const textClass = theme === ThemeMode.DARK ? 'text-gray-300' : theme === ThemeMode.SEPIA ? 'text-[#5b4636]' : 'text-gray-800';
  const activeClass = theme === ThemeMode.DARK ? 'bg-blue-900/50 text-blue-200' : theme === ThemeMode.SEPIA ? 'bg-[#d3c4b1] text-[#3e2f24]' : 'bg-blue-50 text-blue-600';

  if (!isOpen) {
    return (
      <button 
        onClick={onToggle}
        className={`fixed left-4 top-4 z-50 p-2 rounded-full shadow-lg transition-colors ${bgClass} ${textClass}`}
      >
        <Menu size={20} />
      </button>
    );
  }

  return (
    <div className={`fixed inset-y-0 left-0 z-40 w-80 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${bgClass} ${textClass}`}>
      {/* Header */}
      <div className="p-4 border-b border-opacity-20 flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <LibraryIcon size={24} />
          书架
        </h2>
        <button onClick={onToggle} className="p-1 hover:bg-black/10 rounded">
          <Menu size={20} />
        </button>
      </div>

      {/* Book List / Chapter List Toggle */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {!currentBook ? (
          <div className="p-4 space-y-4">
            <div className="text-sm font-medium opacity-70 mb-2">已导入书籍</div>
            {books.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <p className="mb-2">暂无书籍</p>
                <p className="text-xs">请点击下方按钮导入文件</p>
              </div>
            ) : (
              books.map(book => (
                <div 
                  key={book.id}
                  className="group flex items-center justify-between p-3 rounded-lg hover:bg-black/5 cursor-pointer transition-colors"
                  onClick={() => onSelectBook(book.id)}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <BookOpen size={18} className="shrink-0" />
                    <span className="truncate text-sm font-medium">{book.title}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteBook(book.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-opacity-10 bg-black/5 flex items-center justify-between">
              <button 
                onClick={() => onSelectBook('')} // Go back to shelf logic
                className="text-xs hover:underline flex items-center gap-1"
              >
                ← 返回书架
              </button>
              <span className="text-xs font-bold truncate max-w-[150px]">{currentBook.title}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
               {currentBook.chapters.map((chapter) => (
                 <div
                   key={chapter.index}
                   onClick={() => onSelectChapter(chapter.index)}
                   className={`p-2 text-sm rounded cursor-pointer mb-1 truncate ${
                     chapter.index === currentChapterIndex ? activeClass : 'hover:bg-black/5'
                   }`}
                 >
                   {chapter.title}
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div className="p-4 border-t border-opacity-20 bg-black/5 grid grid-cols-2 gap-2">
        <label className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border-2 border-dashed cursor-pointer hover:bg-black/5 transition-colors ${theme === ThemeMode.DARK ? 'border-neutral-700' : 'border-gray-300'}`}>
          <FileUp size={20} />
          <span className="text-xs font-medium">导入文件</span>
          <span className="text-[10px] opacity-60">TXT / MD</span>
          <input 
            type="file" 
            multiple 
            accept=".txt,.md,.markdown"
            className="hidden" 
            onChange={onUpload}
          />
        </label>
        
        <label className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border-2 border-dashed cursor-pointer hover:bg-black/5 transition-colors ${theme === ThemeMode.DARK ? 'border-neutral-700' : 'border-gray-300'}`}>
          <FolderUp size={20} />
          <span className="text-xs font-medium">导入目录</span>
          <span className="text-[10px] opacity-60">批量导入</span>
          <input 
            type="file" 
            webkitdirectory="" 
            directory="" 
            multiple 
            className="hidden" 
            onChange={onUpload}
          />
        </label>
      </div>
    </div>
  );
};

export default Library;