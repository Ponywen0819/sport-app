import { Avatar } from "./components/avatar";
import { InfoSetting } from "./components/info-setting";
import { PasswdSetting } from "./components/passwd-setting";
import { EmailSetting } from "./components/email-setting";

const Page = () => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-2xl mx-auto mt-4">
      <h1 className="text-2xl font-bold border-b border-gray-200 pb-4 mb-6">
        個人資料設定
      </h1>
      <Avatar />
      <InfoSetting />

      <span className="block border-b border-gray-300 my-4" />

      <EmailSetting />
      <PasswdSetting />
    </div>
  );
};

export default Page;
