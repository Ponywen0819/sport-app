"use client";

import {
  ButtonHTMLAttributes,
  createContext,
  MouseEventHandler,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { menu } from "motion/react-client";
import { useAuthStore } from "@/providers/auth-store-provider";

type Offset = {
  top: number;
  left: number;
};

type MenuContextType = {
  onOptionClick: (type: MenuButtonType) => void;
};

const menuContext = createContext<MenuContextType | null>(null);

export const UserButton = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuOffset, setMenuOffset] = useState<Offset>({ top: 0, left: 0 });

  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!isMenuOpen) return;

    const triggerTarget = triggerRef.current;
    const menuTarget = menuRef.current;
    if (!triggerTarget || !menuTarget) return;

    const triggerRect = triggerTarget.getBoundingClientRect();
    const menuRect = menuTarget.getBoundingClientRect();

    const newOffset = {
      top: triggerRect.bottom + 12,
      left: triggerRect.left,
    };

    const viewPortWidth = window.innerWidth;
    debugger;
    if (newOffset.left + menuRect.width + 12 >= viewPortWidth) {
      newOffset.left = viewPortWidth - menuRect.width - 12;
    }

    setMenuOffset(newOffset);
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const clickOutside =
        menuRef.current && !menuRef.current.contains(event.target as Node);
      const clickTrigger =
        triggerRef.current && triggerRef.current.contains(event.target as Node);
      if (!clickTrigger && clickOutside) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleTriggerClick = () => {
    setIsMenuOpen((old) => !old);
  };

  const handleOptionClick = useMemo(
    () => (type: MenuButtonType) => {
      setIsMenuOpen(false);
    },
    [isMenuOpen]
  );

  const menuClasses = `absolute w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 overflow-hidden z-50`;

  const menuBtnClasses = `w-8 h-8 rounded-full bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white`;

  return (
    <menuContext.Provider value={{ onOptionClick: handleOptionClick }}>
      <button
        className={menuBtnClasses}
        onClick={handleTriggerClick}
        ref={triggerRef}
      >
        <span className="text-white">U</span>
      </button>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            ref={menuRef}
            className={menuClasses}
            style={menuOffset}
          >
            <MenuButton>Profile</MenuButton>
            <MenuButton>Settings</MenuButton>
            <SignOutBtn />
          </motion.div>
        )}
      </AnimatePresence>
    </menuContext.Provider>
  );
};

const SignOutBtn = () => {
  const logout = useAuthStore((state) => state.logout);

  const handleClick = () => {
    logout();
  };
  return (
    <MenuButton menuBtnTpe={MenuButtonType.BUTTON} onClick={handleClick}>
      Sign out
    </MenuButton>
  );
};

enum MenuButtonType {
  LINK = "link",
  BUTTON = "button",
}

type MenuButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  menuBtnTpe?: MenuButtonType;
};

const MenuButton = (props: MenuButtonProps) => {
  const {
    className,
    menuBtnTpe = MenuButtonType.LINK,
    onClick,
    ...rest
  } = props;

  const context = useContext(menuContext);
  if (!context) throw new Error("MenuButton must be used within a MenuContext");

  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    onClick?.(e);
    context.onOptionClick(menuBtnTpe);
  };

  const finClassName = `block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
    className || ""
  }`;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={finClassName}
      {...rest}
    />
  );
};
