import { FaWeight } from "react-icons/fa"; // 體重圖標
import { GiBodyBalance } from "react-icons/gi"; // 體脂圖標
import { AiOutlineArrowRight } from "react-icons/ai"; // 箭頭圖標
import { PropsWithChildren } from "react";
import { IconType } from "react-icons";

import ProgressBar from "@/components/progress-bar";

export const WorkoutOverview = () => {
  // 假設這些數據是從狀態管理或 API 獲取的
  const weight = 70; // 體重
  const bodyFat = 15; // 體脂
  const daysMaintained = 30; // 已維持運動計畫天數
  const programName = "全身健身計畫"; // 運動計畫名稱

  return (
    <section className="p-4 w-2/3">
      <h2 className="text-xl font-bold">運動統計狀態</h2>
      <OverviewCard>
        <PlanStatusGroup />
        <BodyIndexGroup weight={weight} bodyFat={bodyFat} />
      </OverviewCard>
    </section>
  );
};

type OverviewCardProps = PropsWithChildren<{}>;

const OverviewCard = (props: OverviewCardProps) => {
  const { children } = props;
  return (
    <button className="bg-green-500 p-4 text-white rounded-lg my-2 cursor-pointer flex flex-col relative w-full hover:bg-green-600">
      {children}
      <div className="absolute right-2 bottom-2 opacity-70">
        <AiOutlineArrowRight className="inline-block ml-2" />
      </div>
    </button>
  );
};

const PlanStatusGroup = () => {
  const programName = "全身健身計畫"; // 當前計畫名稱
  const completionRate = 85; // 當前計畫完成度（百分比）
  const consecutiveDays = 15; // 連續達成計畫次數

  return (
    <div className="mb-4 w-full flex flex-col gap-2">
      <PlanNameIndicator programName={programName} />
      <div className="flex items-center gap-4">
        <p className="text-sm mt-1 text-nowrap ">
          <span className="font-bold">完成度 : </span>
          <span>{completionRate} %</span>
        </p>
        <ProgressBar rate={completionRate} />
      </div>
      <p className="text-sm">
        <span className="font-bold">連續達成計畫次數:</span> {consecutiveDays}{" "}
        天
      </p>
    </div>
  );
};

type PlanNameIndicatorProps = {
  programName: string;
};

const PlanNameIndicator = ({ programName }: PlanNameIndicatorProps) => {
  return (
    <p className="text-xs text-left">
      <span className="mr-1">當前計劃 :</span>
      <span className="text-base font-bold">{programName}</span>
    </p>
  );
};

type BodyIndexGroupProps = {
  weight: number;
  bodyFat: number;
};

const BodyIndexGroup = (props: BodyIndexGroupProps) => {
  const { weight, bodyFat } = props;
  return (
    <div className="flex mt-4 gap-4">
      <BodyIndex icon={FaWeight} label="體重" value={`${weight} kg`} />
      <BodyIndex icon={GiBodyBalance} label="體脂" value={`${bodyFat} %`} />
    </div>
  );
};

type BodyIndexProps = {
  icon: IconType;
  label: string;
  value: string;
};

const BodyIndex = (props: BodyIndexProps) => {
  const { icon, label, value } = props;
  const Icon = icon;
  return (
    <div className="flex items-center">
      <Icon className="text-white mr-2 size-3" />
      <span className="text-sm font-bold">
        {label}: {value}
      </span>
    </div>
  );
};
