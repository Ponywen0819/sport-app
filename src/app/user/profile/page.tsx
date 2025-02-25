"use client";

import { useState } from "react";
import { Avatar } from "./components/avatar";
import { InfoSetting } from "./components/info-setting";
import { PasswdSetting } from "./components/passwd-setting";

const Page = () => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-2xl mx-auto mt-4">
      <h1 className="text-2xl font-bold border-b border-gray-200 pb-4 mb-6">
        個人資料設定
      </h1>
      <Avatar />
      <InfoSetting />

      <span className="block border-b border-gray-300 my-2" />

      <PasswdSetting />

      {/* 電子信箱設定 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">電子信箱</label>
        <input
          type="email"
          defaultValue="user@example.com"
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
        />
        <button
          onClick={() => setIsEmailModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          驗證信箱
        </button>

        {/* 信箱驗證模態框 */}
        {isEmailModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-96">
              <h2 className="text-xl font-bold mb-4">信箱驗證</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="驗證碼"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500">
                  我們已發送驗證碼至您的信箱
                </p>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors"
                >
                  取消
                </button>
                <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  確認驗證
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
