'use client';
import { useAppStore } from '@/lib/store';
import { useEffect, useState } from 'react';

type Theme = 'green' | 'monokai' | 'dark' | 'light';

export default function TabBar() {
  const { openFiles, currentFile, setCurrentFile, closeFile } = useAppStore();
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const html = document.documentElement;
      if (html.classList.contains('theme-greenonblack')) setTheme('green');
      else if (html.classList.contains('theme-monokai')) setTheme('monokai');
      else if (html.classList.contains('dark')) setTheme('dark');
      else setTheme('light');
    }
  }, []);

  if (openFiles.length === 0) return null;

  // Style maps for selected/unselected tabs and close button
  const tabStyles: Record<Theme, {
    selected: React.CSSProperties;
    unselected: React.CSSProperties;
    close: React.CSSProperties;
    closeHover: React.CSSProperties;
    bar: React.CSSProperties;
  }> = {
    green: {
      selected: {
        background: '#000', color: '#33FF33',
        borderLeft: '2px solid #33FF33',
        borderTop: '2px solid #33FF33',
        borderRight: '2px solid #33FF33',
        borderBottom: 'none',
        fontWeight: 600,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        zIndex: 2,
        position: 'relative',
        marginBottom: -2,
        height: 40
      },
      unselected: {
        background: '#001100', color: '#33FF33',
        border: '1px solid #003300',
        fontWeight: 500,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        height: 38,
        zIndex: 1,
        position: 'relative',
        marginBottom: 0
      },
      close: {
        color: '#33FF33', fontWeight: 700
      },
      closeHover: {
        color: '#B6FFB6', fontWeight: 700
      },
      bar: {
        background: '#001100', borderBottom: '2px solid #33FF33', height: 40, position: 'relative', zIndex: 1
      }
    },
    monokai: {
      selected: {
        background: '#272822', color: '#F8F8F2',
        borderLeft: '2px solid #A6E22E',
        borderTop: '2px solid #A6E22E',
        borderRight: '2px solid #A6E22E',
        borderBottom: 'none',
        fontWeight: 600,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        zIndex: 2,
        position: 'relative',
        marginBottom: -2,
        height: 40
      },
      unselected: {
        background: '#1e1f1c', color: '#A6E22E',
        border: '1px solid #3e3d32',
        fontWeight: 500,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        height: 38,
        zIndex: 1,
        position: 'relative',
        marginBottom: 0
      },
      close: {
        color: '#F92672', fontWeight: 700
      },
      closeHover: {
        color: '#A6E22E', fontWeight: 700
      },
      bar: {
        background: '#1e1f1c', borderBottom: '2px solid #A6E22E', height: 40, position: 'relative', zIndex: 1
      }
    },
    dark: {
      selected: {
        background: '#23272e', color: '#60a5fa', border: '2px solid #60a5fa', borderBottom: 'none', fontWeight: 600, borderTopLeftRadius: 0, borderTopRightRadius: 0, height: 40, marginBottom: -2
      },
      unselected: {
        background: 'transparent', color: '#cbd5e1', border: 'none', fontWeight: 500, height: 38
      },
      close: {
        color: '#60a5fa', fontWeight: 700
      },
      closeHover: {
        color: '#f87171', fontWeight: 700
      },
      bar: {
        background: '#23272e', borderBottom: '2px solid #60a5fa', height: 40
      }
    },
    light: {
      selected: {
        background: '#fff', color: '#2563eb', border: '2px solid #2563eb', borderBottom: 'none', fontWeight: 600, borderTopLeftRadius: 0, borderTopRightRadius: 0, height: 40, marginBottom: -2
      },
      unselected: {
        background: 'transparent', color: '#222', border: 'none', fontWeight: 500, height: 38
      },
      close: {
        color: '#2563eb', fontWeight: 700
      },
      closeHover: {
        color: '#f87171', fontWeight: 700
      },
      bar: {
        background: '#f3f4f6', borderBottom: '2px solid #2563eb', height: 40
      }
    }
  };

  return (
    <div className="flex-shrink-0 flex items-center px-2 space-x-1 select-none" style={tabStyles[theme].bar}>
      {openFiles.map((file) => {
        const selected = currentFile?.id === file.id;
        const style = selected ? tabStyles[theme].selected : tabStyles[theme].unselected;
        // Determine section label
        let sectionLabel = '';
        if (file.section) sectionLabel = file.section;
        else if (file.name.toLowerCase().includes('artifact')) sectionLabel = 'Artifact';
        else if (file.name.toLowerCase().includes('legal')) sectionLabel = 'Legal';
        else if (file.name.toLowerCase().includes('timeline')) sectionLabel = 'Timeline';
        else sectionLabel = 'Master';
        return (
          <div
            key={file.id}
            style={{...style, borderRadius: 0, display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0 16px'}}
            onClick={() => setCurrentFile(file)}
          >
            <div className="flex flex-col items-start gap-0 w-full">
              <div className="flex items-center gap-2 w-full">
                <span className="truncate max-w-xs" style={{color: style.color, fontWeight: style.fontWeight}}>{file.name}</span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    closeFile(file.id);
                  }}
                  style={tabStyles[theme].close}
                  onMouseOver={e => (e.currentTarget.style.color = tabStyles[theme].closeHover.color ?? '#fff')}
                  onMouseOut={e => (e.currentTarget.style.color = tabStyles[theme].close.color ?? '#fff')}
                  className="text-xs focus:outline-none"
                  title="Close tab"
                >
                  ×
                </button>
              </div>
              {sectionLabel && (
                <span className="text-[10px] leading-tight text-gray-400 mt-0" style={{fontWeight: 400, marginTop: '2px'}}>{sectionLabel}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}