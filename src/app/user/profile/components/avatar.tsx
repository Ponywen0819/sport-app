"use client";

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useForm } from "react-hook-form";

type AvatarContext = {
  file: File | null;
  onTriggerSelect: (file: File) => void;
  onModelClose: () => void;
};

const avatarContext = createContext<AvatarContext | null>(null);

const useAvatarContext = <T,>(selector: (context: AvatarContext) => T): T => {
  const context = useContext(avatarContext);
  if (!context) throw new Error("not in avatar provider");

  return selector(context);
};

export const Avatar = () => {
  const [selectImg, setSelectImg] = useState<File | null>(null);

  const handleModelClose = () => {
    setSelectImg(null);
  };

  const handleTriggerSelect: AvatarContext["onTriggerSelect"] = (file) => {
    setSelectImg(file);
  };

  const contextValue: AvatarContext = {
    file: selectImg || null,
    onTriggerSelect: handleTriggerSelect,
    onModelClose: handleModelClose,
  };

  return (
    <avatarContext.Provider value={contextValue}>
      <UploadImgTrigger />
      <AnimatePresence>{selectImg && <ImgEditingModel />}</AnimatePresence>
    </avatarContext.Provider>
  );
};

const UploadImgTrigger = () => {
  const onTriggerSelect = useAvatarContext((c) => c.onTriggerSelect);
  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.click();

    input.addEventListener("change", (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      file && onTriggerSelect(file);
    });
  };

  return (
    <div className="flex items-center flex-col gap-4 mb-6">
      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center relative">
        <div className=" rounded-full overflow-hidden">
          <img
            src="https://placehold.jp/150x150.png"
            alt="avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <button
          className="absolute inset-0 w-full h-full bg-gray-700/0 opacity-0 hover:bg-gray-700/30 hover:opacity-100 transition-opacity flex items-center justify-center rounded-full"
          onClick={handleClick}
        >
          <div className="absolute bottom-1/2 right-1/2 translate-y-1/2 translate-x-1/2">
            <svg
              className="box-content w-5 h-5  text-white "
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>
        </button>
      </div>
      <p>
        <span className="text-xl font-bold">#user identity </span>
      </p>
    </div>
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

const ImgEditingModel = () => {
  const file = useAvatarContext((c) => c.file);
  const onModelClose = useAvatarContext((c) => c.onModelClose);
  const modelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const handleClickOutside = (event: MouseEvent) => {
      const clickOutside =
        modelRef.current && !modelRef.current.contains(event.target as Node);
      if (clickOutside) onModelClose();
    };

    window.addEventListener("mousedown", handleClickOutside, controller);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <Portal selector="body">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center ">
          <div className="bg-white rounded-lg p-3  relative" ref={modelRef}>
            <p className="text-lg/snug font-bold mb-4">編輯圖片</p>
            <div className="mx-auto w-fit">
              <ImgEditingForm />
            </div>

            <button className="absolute top-2 right-2 p-1 bg-gray-700/0 hover:bg-gray-700/30 text-stone-900 rounded-full">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </Portal>
  );
};

const ImgEditingForm = () => {
  const file = useAvatarContext((c) => c.file);
  const onClose = useAvatarContext((c) => c.onModelClose);

  const [objectUrl, setObjectUrl] = useState("");
  useEffect(() => {
    if (!file) return;

    const newObjUrl = URL.createObjectURL(file);
    setObjectUrl(newObjUrl);
    return () => URL.revokeObjectURL(newObjUrl);
  }, [file]);

  return (
    <form className="relative overflow-hidden rounded-sm">
      {objectUrl && (
        <img
          aria-label="new-avatar"
          className="rounded-full w-48 h-48 object-center object-cover"
          src={objectUrl}
        />
      )}

      <div className="flex gap-2 mt-3 justify-center">
        <button
          type="button"
          className="flex-1 py-2 rounded-sm  bg-stone-900 text-white hover:bg-stone-500 transition-colors text-sm"
          onClick={onClose}
        >
          確認上傳
        </button>
        <button
          type="button"
          className="flex-1 py-2 border-2  border-stone-900 rounded-sm text-sm bg-white text-stone-900 hover:bg-stone-900 hover:text-white transition-colors"
          onClick={onClose}
        >
          取消
        </button>
      </div>
    </form>
  );
};

const useImg = (file: File | null) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      return;
    }

    const objUrl = URL.createObjectURL(file);
    const imageEle = new Image();

    setIsLoading(true);
    imageEle.src = objUrl;
    imageEle.onload = () => {
      setIsLoading(false);
      setImg(imageEle);
    };
    return () => URL.revokeObjectURL(objUrl);
  }, [file]);

  return { img, isLoading } as const;
};

const drawImage = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  img: HTMLImageElement
) => {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const imgRatio = img.width / img.height;
  if (imgRatio < 1) {
    const padding = (canvas.width - img.width) / 2;
    ctx.drawImage(img, padding, 0, img.width, img.height);
  }
};
