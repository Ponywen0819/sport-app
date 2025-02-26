"use client";

import { AnimatePresence, motion } from "motion/react";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type ModelProps = PropsWithChildren<{
  show?: boolean;
  onClose?: () => void;
}>;

export const Model = (props: ModelProps) => {
  useEffect(() => {
    if (!props.show) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [props.show]);

  return (
    <Portal selector="body">
      <AnimatePresence>
        {props.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gray-600/90 flex items-center justify-center"
          >
            <div className="bg-white rounded-lg p-3 w-96 relative">
              <CloseButton onClick={props.onClose} />
              {props.children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
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

type CloseButtonProps = {
  onClick?: () => void;
};

const CloseButton = (props: CloseButtonProps) => {
  return (
    <button
      className="absolute top-2 right-2 p-1 bg-gray-700/0 hover:bg-gray-700/30 text-stone-900 rounded-full"
      onClick={props.onClick}
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
  );
};
