'use client';
import { useAppStore } from '@/lib/store';
import { FileIcon, FolderIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export default function FileTree() {
  const { setCurrentFile } = useAppStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderNode = (node: FileNode, path: string = 'root') => {
    const isExpanded = expandedFolders.has(path);
    const isDirectory = node.type === 'directory';

    return (
      <div key={path} className="pl-4">
        <div
          className={`flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 theme-monokai:hover:bg-[#3e3d32] theme-greenonblack:hover:bg-[#002200] text-sm
            ${isDirectory ? 'text-gray-700 dark:text-gray-300 theme-monokai:text-[#F8F8F2] theme-greenonblack:text-[#00FF00]' : 'text-gray-600 dark:text-gray-400 theme-monokai:text-[#F8F8F2] theme-greenonblack:text-[#00FF00]'}`}
          onClick={() => {
            if (isDirectory) {
              toggleFolder(path);
            } else {
              setCurrentFile({
                id: path,
                name: node.name,
                content: '',
                type: node.name.endsWith('.json') ? 'json' : 'markdown'
              });
            }
          }}
        >
          {isDirectory ? (
            <>
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400 theme-monokai:text-[#F8F8F2] theme-greenonblack:text-[#00FF00]" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400 theme-monokai:text-[#F8F8F2] theme-greenonblack:text-[#00FF00]" />
              )}
              <FolderIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400 theme-monokai:text-[#F8F8F2] theme-greenonblack:text-[#00FF00]" />
            </>
          ) : (
            <FileIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400 theme-monokai:text-[#F8F8F2] theme-greenonblack:text-[#00FF00]" />
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {isDirectory && isExpanded && node.children?.map((child) => 
          renderNode(child, `${path}/${child.name}`)
        )}
      </div>
    );
  };

  const fileTree: FileNode = {
    name: 'root',
    type: 'directory',
    children: [
      {
        name: 'src',
        type: 'directory',
        children: [
          {
            name: 'components',
            type: 'directory',
            children: [
              { name: 'Button.tsx', type: 'file' },
              { name: 'Card.tsx', type: 'file' },
              { name: 'Input.tsx', type: 'file' }
            ]
          },
          {
            name: 'pages',
            type: 'directory',
            children: [
              { name: 'index.tsx', type: 'file' },
              { name: 'about.tsx', type: 'file' }
            ]
          },
          { name: 'App.tsx', type: 'file' },
          { name: 'index.tsx', type: 'file' }
        ]
      },
      {
        name: 'public',
        type: 'directory',
        children: [
          { name: 'favicon.ico', type: 'file' },
          { name: 'logo.png', type: 'file' }
        ]
      },
      { name: 'package.json', type: 'file' },
      { name: 'README.md', type: 'file' },
      { name: 'tsconfig.json', type: 'file' }
    ]
  };

  return (
    <div className="h-full overflow-y-auto theme-monokai:bg-[#272822] theme-greenonblack:bg-black dark:bg-gray-950 border-r border-gray-200 dark:border-gray-700 theme-monokai:border-[#3e3d32] theme-greenonblack:border-[#003300]">
      {renderNode(fileTree)}
    </div>
  );
} 