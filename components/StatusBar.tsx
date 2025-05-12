'use client';
import { useAppStore } from '@/lib/store';

export default function StatusBar() {
  const { currentFile } = useAppStore();

  return (
    <div className="flex items-center h-6 px-4 text-xs theme-monokai:bg-[#1e1f1c] theme-monokai:text-[#F8F8F2] theme-greenonblack:bg-[#001100] theme-greenonblack:text-[#33FF33] dark:bg-gray-900 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 theme-monokai:border-[#3e3d32] theme-greenonblack:border-[#003300]">
      <div className="flex items-center space-x-4">
        <span>Ln 1, Col 1</span>
        <span>Spaces: 2</span>
        <span>UTF-8</span>
        {currentFile && (
          <span className="theme-monokai:text-[#F8F8F2] theme-greenonblack:text-[#33FF33] dark:text-blue-400 text-blue-600">
            {currentFile.name}
          </span>
        )}
      </div>
    </div>
  );
} 