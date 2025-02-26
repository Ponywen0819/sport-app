"use client";

import { Model } from "@/components/model";
import { InputGroup } from "./input-group";
import { useState } from "react";

export const EmailSetting = () => {
  const [isModelReveal, setIsModelReveal] = useState(false);
  const handleTriggerClick = () => {
    setIsModelReveal(true);
  };

  const handleModelClose = () => {
    setIsModelReveal(false);
  };

  return (
    <div className="mb-6">
      <div className="relative">
        <InputGroup
          label="電子信箱"
          type="email"
          placeholder="請輸入電子信箱"
          disabled
          className="text-gray-500 pr-12"
        />
        <button
          type="button"
          className="absolute right-0 top-1/2 -translate-y-1/2 mt-2 mr-2 text-xs font-bold bg-stone-900 hover:bg-gray-500 text-white rounded-sm px-2 py-1"
          onClick={handleTriggerClick}
        >
          變更電子信箱
        </button>
        <Model show={isModelReveal} onClose={handleModelClose}>
          <EmailSettingField />
        </Model>
      </div>
    </div>
  );
};

const EmailSettingField = () => {
  return (
    <form>
      <p className="text-lg/snug font-bold mb-4">設定電子郵箱</p>
      <div className="space-y-4">
        <div className="relative">
          <InputGroup
            label="新電子郵箱"
            type="email"
            placeholder="請輸入新電子郵箱"
            className="pr-24"
          />
          <button
            type="button"
            className="absolute right-0 top-1/2 -translate-y-1/2 mt-2 mr-2 text-xs font-bold bg-stone-900 hover:bg-gray-500 text-white rounded-sm px-2 py-1"
          >
            發送驗證碼
          </button>
        </div>

        <InputGroup
          label="驗證碼"
          type="email"
          placeholder="請輸入新電子郵箱"
        />

        <button
          type="submit"
          className="w-full bg-stone-900 text-white rounded-sm py-2"
        >
          送出
        </button>

        <button
          type="button"
          className="w-full bg-gray-200 text-black rounded-sm py-2"
        >
          取消
        </button>
      </div>
    </form>
  );
};
