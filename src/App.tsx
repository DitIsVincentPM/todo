import React, { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';

function App() {
  const [content, setContent] = useState('');
  const [isMarkdownView, setIsMarkdownView] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState('main');
  const [pages, setPages] = useState<Record<string, string>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load content and pages from localStorage on mount
  useEffect(() => {
    try {
      // Load main content
      const savedContent = localStorage.getItem('todo-content');
      if (savedContent && savedContent.length > 0) {
        console.log('Loading from localStorage:', savedContent.length, 'characters');
        setContent(savedContent);
      } else {
        const defaultContent = `# TODO

6 October 11:20 AM
## School
- Oefeningen Programming Fundamentals Week 3
- Oefeningen Database Week 3
- VIM leren voor Operating Systems

## Joyforge
- Social's aanmaken JoyForge voor Marketing
- Kijken voor whiteboard

## Prive
- Plek vrijmaken op Laptop
- Kast opruimen
- Kleren naar kast kamer

---

## School
- Samevattingen maken van alle Diagrammen van Conceptual Thinking
- Samevatting commando's van Operating Systems
- Samevatting van Database Fundamentals
- Replacement vinden voor laptop stand
- Home Server updaten naar alles te pointe naar een domein
- Neef sturen over de website voor garage
- Punten boekje maken?
- Backup nemen van ELSDONCK website
- Dock bestellen`;
        setContent(defaultContent);
      }

      // Load additional pages
      const savedPages = localStorage.getItem('todo-pages');
      if (savedPages) {
        setPages(JSON.parse(savedPages));
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      setContent('# TODO\n\nStart typing...');
    }
  }, []);

  // Save content and current page to localStorage whenever they change
  useEffect(() => {
    if (currentPage === 'main') {
      if (content) {
        try {
          localStorage.setItem('todo-content', content);
          console.log('Saved main page to localStorage:', content.length, 'characters');
        } catch (error) {
          console.error('Failed to save to localStorage:', error);
        }
      }
    } else {
      // Save to pages object
      const updatedPages = { ...pages, [currentPage]: content };
      setPages(updatedPages);
      try {
        localStorage.setItem('todo-pages', JSON.stringify(updatedPages));
        console.log('Saved page', currentPage, 'to localStorage:', content.length, 'characters');
      } catch (error) {
        console.error('Failed to save pages to localStorage:', error);
      }
    }
  }, [content, currentPage, pages]);

  const getCurrentDateTime = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('en-US', { month: 'long' });
    const time = now.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${day} ${month} ${time}`;
  };

  const toggleMode = useCallback(() => {
    setIsMarkdownView(!isMarkdownView);
  }, [isMarkdownView]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Handle Alt + Shift + Arrow Up/Down for mode switching
    if (e.altKey && e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      toggleMode();
      return;
    }

    // Handle /date command
    if (e.key === 'Enter' || e.key === ' ') {
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = content.substring(0, cursorPos);
      const lastWord = textBeforeCursor.split(/\s/).pop() || '';

      if (lastWord === '/date') {
        e.preventDefault();
        const newDateTime = getCurrentDateTime();
        const beforeCommand = content.substring(0, cursorPos - 5);
        const afterCursor = content.substring(cursorPos);
        const newContent = beforeCommand + newDateTime + afterCursor;
        setContent(newContent);

        setTimeout(() => {
          if (textarea) {
            const newPos = cursorPos - 5 + newDateTime.length;
            textarea.setSelectionRange(newPos, newPos);
            textarea.focus();
          }
        }, 0);
        return;
      }
    }

    // Handle Alt + Arrow Up/Down for moving lines
    if (e.altKey && !e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();

      const lines = content.split('\n');
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = content.substring(0, cursorPos);
      const currentLineIndex = textBeforeCursor.split('\n').length - 1;

      if (e.key === 'ArrowUp' && currentLineIndex > 0) {
        // Calculate cursor position on current line
        const currentLineStart = textBeforeCursor.lastIndexOf('\n') + 1;
        const cursorPosInLine = cursorPos - currentLineStart;

        const temp = lines[currentLineIndex];
        lines[currentLineIndex] = lines[currentLineIndex - 1];
        lines[currentLineIndex - 1] = temp;

        const newContent = lines.join('\n');
        setContent(newContent);

        // Restore cursor position on the moved line
        setTimeout(() => {
          if (textarea) {
            const newLines = newContent.split('\n');
            let newLineStart = 0;
            for (let i = 0; i < currentLineIndex - 1; i++) {
              newLineStart += newLines[i].length + 1; // +1 for \n
            }
            const newCursorPos = newLineStart + Math.min(cursorPosInLine, newLines[currentLineIndex - 1].length);
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.focus();
          }
        }, 0);
      } else if (e.key === 'ArrowDown' && currentLineIndex < lines.length - 1) {
        // Calculate cursor position on current line
        const currentLineStart = textBeforeCursor.lastIndexOf('\n') + 1;
        const cursorPosInLine = cursorPos - currentLineStart;

        const temp = lines[currentLineIndex];
        lines[currentLineIndex] = lines[currentLineIndex + 1];
        lines[currentLineIndex + 1] = temp;

        const newContent = lines.join('\n');
        setContent(newContent);

        // Restore cursor position on the moved line
        setTimeout(() => {
          if (textarea) {
            const newLines = newContent.split('\n');
            let newLineStart = 0;
            for (let i = 0; i < currentLineIndex + 1; i++) {
              newLineStart += newLines[i].length + 1; // +1 for \n
            }
            const newCursorPos = newLineStart + Math.min(cursorPosInLine, newLines[currentLineIndex + 1].length);
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.focus();
          }
        }, 0);
      }
    }
  }, [content, toggleMode]);

  // Handle global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        setIsMarkdownView(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const toggleTodoItem = (lineIndex: number) => {
    const lines = content.split('\n');
    const line = lines[lineIndex];

    if (line.trim().startsWith('- ')) {
      if (line.includes('✓')) {
        lines[lineIndex] = line.replace(' ✓ ', ' ').replace('✓', '');
      } else {
        // Mark as completed
        lines[lineIndex] = line.replace('- ', '- ✓ ');

        // Auto-move to the latest logbook entry
        const completedItem = lines[lineIndex];

        // Find the latest (most recent) logbook date entry
        const isLogbookDate = (line: string) => {
          const trimmed = line.trim();
          return /^\d{1,2}\s+\w+\s+\d{1,2}:\d{2}\s+(AM|PM)$/.test(trimmed);
        };

        let latestLogbookIndex = -1;

        // Search through all lines to find the latest logbook entry
        for (let i = 0; i < lines.length; i++) {
          if (isLogbookDate(lines[i])) {
            latestLogbookIndex = i;
          }
        }

        if (latestLogbookIndex === -1) {
          // No logbook entry exists, create new one at the top
          const currentDateTime = getCurrentDateTime();
          lines.splice(1, 0, '', currentDateTime, completedItem);
          // Remove the original item (adjust index due to insertions)
          lines.splice(lineIndex + 3, 1);
        } else {
          // Find the end of the latest logbook section
          let insertIndex = latestLogbookIndex + 1;

          while (insertIndex < lines.length) {
            const line = lines[insertIndex];
            if (line.trim().startsWith('# ') ||
                line.trim().startsWith('## ') ||
                line.trim() === '---' ||
                isLogbookDate(line)) {
              break;
            }
            insertIndex++;
          }

          // Insert completed item at the end of the latest logbook section
          lines.splice(insertIndex, 0, completedItem);

          // Remove original item (adjust index if insertion was before original)
          const adjustedIndex = insertIndex <= lineIndex ? lineIndex + 1 : lineIndex;
          lines.splice(adjustedIndex, 1);
        }
      }
      setContent(lines.join('\n'));
    }
  };


  const handleCancelDrag = useCallback(() => {
    console.log('Cancel drag');
    setDraggedIndex(null);
    setIsDragging(false);
    setDropTargetIndex(null);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const handleCompleteDrop = useCallback((targetIndex?: number) => {
    if (draggedIndex === null) {
      handleCancelDrag();
      return;
    }

    const finalTargetIndex = targetIndex ?? dropTargetIndex;

    if (finalTargetIndex === null || draggedIndex === finalTargetIndex) {
      handleCancelDrag();
      return;
    }

    console.log('Complete drop at:', finalTargetIndex, 'from:', draggedIndex);

    const lines = content.split('\n');
    const draggedLine = lines[draggedIndex];

    // Simple array reordering
    const newLines = [...lines];
    newLines.splice(draggedIndex, 1); // Remove from old position
    newLines.splice(finalTargetIndex > draggedIndex ? finalTargetIndex - 1 : finalTargetIndex, 0, draggedLine); // Insert at new position

    setContent(newLines.join('\n'));
    handleCancelDrag();
  }, [draggedIndex, dropTargetIndex, content, handleCancelDrag]);

  const handleCompleteLogbookDrop = useCallback((logbookIndex?: number) => {
    if (draggedIndex === null) {
      handleCancelDrag();
      return;
    }

    const finalLogbookIndex = logbookIndex ?? dropTargetIndex;

    if (finalLogbookIndex === null) {
      handleCancelDrag();
      return;
    }

    const lines = content.split('\n');
    const draggedLine = lines[draggedIndex];

    // Only allow dropping todo items into logbook
    if (!draggedLine.trim().startsWith('- ')) {
      handleCancelDrag();
      return;
    }

    console.log('Complete logbook drop at:', finalLogbookIndex, 'from:', draggedIndex);

    // Remove the dragged todo item
    const newLines = [...lines];
    newLines.splice(draggedIndex, 1);

    // Find the end of the logbook section to insert the todo
    let insertIndex = finalLogbookIndex + 1;
    const isLogbookDate = (line: string) => {
      const trimmed = line.trim();
      return /^\d{1,2}\s+\w+\s+\d{1,2}:\d{2}\s+(AM|PM)$/.test(trimmed);
    };

    // Find where this logbook section ends
    while (insertIndex < newLines.length) {
      const line = newLines[insertIndex];
      if (line.trim().startsWith('# ') ||
          line.trim().startsWith('## ') ||
          line.trim() === '---' ||
          isLogbookDate(line)) {
        break;
      }
      insertIndex++;
    }

    // Insert the todo at the end of the logbook section
    newLines.splice(insertIndex, 0, draggedLine);

    setContent(newLines.join('\n'));
    handleCancelDrag();
  }, [draggedIndex, dropTargetIndex, content, handleCancelDrag]);

  // Mouse follow dragging system
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setDragPosition({ x: e.clientX, y: e.clientY });

        // Find drop target while dragging
        const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
        if (elementAtPoint) {
          const todoItem = elementAtPoint.closest('.todo-item, .logbook-todo-item') as HTMLElement;
          const logbookEntry = elementAtPoint.closest('.logbook-entry') as HTMLElement;

          if (todoItem && todoItem.dataset.index) {
            const targetIndex = parseInt(todoItem.dataset.index);
            if (targetIndex !== draggedIndex) {
              setDropTargetIndex(targetIndex);
            }
          } else if (logbookEntry && logbookEntry.dataset.index) {
            const logbookIndex = parseInt(logbookEntry.dataset.index);
            setDropTargetIndex(logbookIndex);
          } else {
            setDropTargetIndex(null);
          }
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();

        // Find the element at the mouse position
        const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);

        if (elementAtPoint) {
          // Check if it's a todo item or logbook
          const todoItem = elementAtPoint.closest('.todo-item, .logbook-todo-item') as HTMLElement;
          const logbookEntry = elementAtPoint.closest('.logbook-entry') as HTMLElement;

          if (todoItem && todoItem.dataset.index) {
            const targetIndex = parseInt(todoItem.dataset.index);
            handleCompleteDrop(targetIndex);
          } else if (logbookEntry && logbookEntry.dataset.index) {
            const logbookIndex = parseInt(logbookEntry.dataset.index);
            handleCompleteLogbookDrop(logbookIndex);
          } else {
            // Cancel drag if releasing elsewhere
            handleCancelDrag();
          }
        } else {
          handleCancelDrag();
        }
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { capture: true });
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp, { capture: true });
      if (isDragging) {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
  }, [isDragging, draggedIndex, handleCancelDrag, handleCompleteDrop, handleCompleteLogbookDrop]);

  const startDrag = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Start drag:', index);
    setDraggedIndex(index);
    setIsDragging(true);
    setDropTargetIndex(null);
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handleItemHover = (index: number) => {
    if (isDragging && draggedIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const CustomMarkdown = ({ children }: { children: string }) => {
    const lines = children.split('\n');

    return (
      <div className="custom-markdown">
        {lines.map((line, index) => {
          // Skip empty lines entirely
          if (line.trim() === '') {
            return null;
          }

          if (line.trim().startsWith('# ')) {
            return <h1 key={index} className="markdown-h1">{line.substring(2)}</h1>;
          } else if (line.trim().startsWith('## ')) {
            return <h2 key={index} className="markdown-h2">{line.substring(3)}</h2>;
          } else if (line.trim().startsWith('- ')) {
            const isCompleted = line.includes('✓');
            const displayText = line.substring(2); // Remove "- "

            return (
              <div
                key={index}
                className={`todo-item ${isCompleted ? 'completed' : ''} ${draggedIndex === index ? 'dragging' : ''} ${dropTargetIndex === index ? 'drop-target' : ''}`}
                data-index={index}
                onMouseEnter={() => handleItemHover(index)}
              >
                <span
                  className="drag-handle"
                  onMouseDown={(e) => startDrag(index, e)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    startDrag(index, e as unknown as React.MouseEvent);
                  }}
                >
                  ⋮⋮
                </span>
                <span
                  className="todo-text"
                  onClick={() => toggleTodoItem(index)}
                >
                  {displayText}
                </span>
              </div>
            );
          } else if (line.trim() === '---') {
            return <hr key={index} />;
          } else {
            return <p key={index}>{line}</p>;
          }
        }).filter(Boolean)} {/* Filter out null values from empty lines */}
      </div>
    );
  };

  // Switch to a different page
  const switchToPage = useCallback((pageId: string) => {
    if (pageId === currentPage) return;

    // Save current content before switching
    if (currentPage === 'main') {
      localStorage.setItem('todo-content', content);
    } else {
      const updatedPages = { ...pages, [currentPage]: content };
      setPages(updatedPages);
      localStorage.setItem('todo-pages', JSON.stringify(updatedPages));
    }

    // Load new page content
    if (pageId === 'main') {
      const savedContent = localStorage.getItem('todo-content') || '';
      setContent(savedContent);
    } else {
      const pageContent = pages[pageId] || `# ${pageId.charAt(0).toUpperCase() + pageId.slice(1)}\n\n- Start adding your todos here...`;
      setContent(pageContent);
    }

    setCurrentPage(pageId);
  }, [content, currentPage, pages]);

  // Create a new page
  const createNewPage = useCallback(() => {
    const pageName = prompt('Enter page name:');
    if (!pageName || pageName.trim() === '') return;

    const pageId = pageName.toLowerCase().replace(/\s+/g, '-');
    if (pageId === 'main' || pages[pageId]) {
      alert('Page already exists!');
      return;
    }

    const newPageContent = `# ${pageName}\n\n- Start adding your todos here...`;
    const updatedPages = { ...pages, [pageId]: newPageContent };
    setPages(updatedPages);
    localStorage.setItem('todo-pages', JSON.stringify(updatedPages));

    // Switch to the new page
    switchToPage(pageId);
  }, [pages, switchToPage]);

  // Delete a page
  const deletePage = useCallback((pageId: string) => {
    if (pageId === 'main') return; // Can't delete main page

    if (window.confirm(`Are you sure you want to delete the "${pageId}" page?`)) {
      const updatedPages = { ...pages };
      delete updatedPages[pageId];
      setPages(updatedPages);
      localStorage.setItem('todo-pages', JSON.stringify(updatedPages));

      // Switch to main if deleting current page
      if (currentPage === pageId) {
        switchToPage('main');
      }
    }
  }, [pages, currentPage, switchToPage]);

  return (
    <div className="App">
      <div className="floating-shortcuts">
        <div className="shortcuts-title">Shortcuts</div>
        <div className="shortcut-item">
          <span className="shortcut-key">Alt+Shift+↑/↓</span>
          <span className="shortcut-desc">Toggle mode</span>
        </div>
        <div className="shortcut-item">
          <span className="shortcut-key">Alt+↑/↓</span>
          <span className="shortcut-desc">Move lines</span>
        </div>
        <div className="shortcut-item">
          <span className="shortcut-key">/date</span>
          <span className="shortcut-desc">Insert timestamp</span>
        </div>
        <div className="shortcuts-divider"></div>
        <div className="shortcuts-title">Pages</div>
        <div className="page-controls">
          <button onClick={createNewPage} className="new-page-btn">+ New Page</button>
          <select
            value={currentPage}
            onChange={(e) => switchToPage(e.target.value)}
            className="page-selector"
          >
            <option value="main">Main</option>
            {Object.keys(pages).map((pageId) => (
              <option key={pageId} value={pageId}>
                {pageId.charAt(0).toUpperCase() + pageId.slice(1)}
              </option>
            ))}
          </select>
        </div>
        {Object.keys(pages).length > 0 && (
          <div className="page-list">
            {Object.keys(pages).map((pageId) => (
              <div key={pageId} className="page-item">
                <button
                  onClick={() => switchToPage(pageId)}
                  className={`page-btn ${currentPage === pageId ? 'active' : ''}`}
                >
                  {pageId.charAt(0).toUpperCase() + pageId.slice(1)}
                </button>
                <button
                  onClick={() => deletePage(pageId)}
                  className="delete-page-btn"
                  title={`Delete ${pageId} page`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="shortcuts-divider"></div>
        <div className="mode-toggle">
          <button
            onClick={toggleMode}
            className={isMarkdownView ? 'active' : ''}
          >
            {isMarkdownView ? 'Editor' : 'Preview'}
          </button>
        </div>
        <div className="debug-info">
          <small>Page: {currentPage} | Content: {content.length} chars</small>
        </div>
      </div>

      <div className="editor-container">
        {isMarkdownView ? (
          <div className="markdown-preview">
            <CustomMarkdown>{content}</CustomMarkdown>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="editor"
            placeholder="Start typing your TODO list..."
            spellCheck={false}
          />
        )}
      </div>

      {/* Floating drag preview */}
      {isDragging && draggedIndex !== null && (
        <div
          className="drag-preview"
          style={{
            position: 'fixed',
            left: dragPosition.x + 10,
            top: dragPosition.y - 20,
            pointerEvents: 'none',
            zIndex: 1000,
            backgroundColor: '#fff',
            border: '2px solid #007acc',
            borderRadius: '4px',
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            fontSize: '14px',
            maxWidth: '300px',
            opacity: 0.9
          }}
        >
          {content.split('\n')[draggedIndex]?.replace('- ', '').replace('✓', '').trim() || 'Dragging item...'}
        </div>
      )}
    </div>
  );
}

export default App;
