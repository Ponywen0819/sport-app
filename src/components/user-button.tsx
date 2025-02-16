"use client";

import { useEffect, useRef, useState } from "react";

export const UserButton = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const menuClasses = `absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 ${
    isMenuOpen ? "block" : "hidden"
  }`;

  const menuBtnClasses = `w-8 h-8 rounded-full bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white`;

  return (
    <>
      <button className={menuBtnClasses} onClick={toggleMenu}>
        <span className="text-white">U</span>
      </button>
      <div ref={menuRef} className={menuClasses}>
        <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          Profile
        </button>
        <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          Settings
        </button>
        <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          Sign out
        </button>
      </div>
    </>
  );
};
