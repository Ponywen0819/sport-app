"use client";

import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import { InputGroup } from "./input-group";

export const PasswdSetting = () => {
  const [isModelReveal, setIsModelReveal] = useState(false);

  const handleTriggerClick = () => {
    setIsModelReveal(true);
  };

  const handleModelClose = () => {
    setIsModelReveal(false);
  };

  return (
    <>
      <div className="mb-6">
        <label className="block text-xs font-medium mb-2">密碼</label>
        <button
          className="px-4 py-2 bg-stone-900 text-sm text-white rounded hover:bg-gray-500 transition-colors"
          onClick={handleTriggerClick}
        >
          更改密碼
        </button>
      </div>
      <AnimatePresence>
        {isModelReveal && <PasswdModel onClose={handleModelClose} />}
      </AnimatePresence>
    </>
  );
};

type PortalProps = PropsWithChildren<{
  selector: string;
}>;

const Portal = (props: PortalProps) => {
  const { selector, children } = props;

  const mountRef = useRef<HTMLBodyElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    mountRef.current = document.querySelector("body");
    setIsMounted(true);
  }, [selector]);

  return mountRef.current ? createPortal(children, mountRef.current) : null;
};

type PasswdModelProps = {
  onClose?: () => void;
};

const PasswdModel = (props: PasswdModelProps) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleModelClose = () => props.onClose?.();

  return (
    <Portal selector="body">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-gray-600/90 flex items-center justify-center"
      >
        <div className="bg-white rounded-lg p-3 w-96 relative">
          <button
            className="absolute top-2 right-2 p-1 bg-gray-700/0 hover:bg-gray-700/30 text-stone-900 rounded-full"
            onClick={handleModelClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <p className="text-lg/snug font-bold mb-4">更改密碼</p>
          <div className="space-y-4">
            <InputGroup
              type="password"
              placeholder="請輸入舊密碼"
              label="舊密碼"
            />
            <InputGroup
              type="password"
              placeholder="請輸入新密碼"
              label="新密碼"
            />
            <InputGroup
              type="password"
              placeholder="再次輸入新密碼"
              label="確認新密碼"
            />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button
              className="px-4 py-2 text-sm border rounded hover:bg-gray-100 transition-colors"
              onClick={handleModelClose}
            >
              取消
            </button>
            <button
              className="px-4 py-2 text-sm bg-stone-900 text-white rounded hover:bg-gray-500 transition-colors"
              onClick={handleModelClose}
            >
              確認更改
            </button>
          </div>
        </div>
      </motion.div>
    </Portal>
  );
};
