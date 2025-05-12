"use client";

export default function LoggedOutFooter() {
  return (
    <div className="w-full bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-2 px-4 text-xs text-gray-500 dark:text-gray-400">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex gap-4">
          <a href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300">Terms</a>
          <a href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300">Privacy</a>
          <a href="/contact" className="hover:text-gray-700 dark:hover:text-gray-300">Contact</a>
        </div>
        <div>
          © {new Date().getFullYear()} Cursor for Sales
        </div>
      </div>
    </div>
  );
} 