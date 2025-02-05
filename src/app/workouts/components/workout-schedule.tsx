import React from "react";
import Link from "next/link";

export const WorkoutSchedule = () => {
  // 假設當前計劃，可能的值為 "專項運動" 或 "休息日"
  const currentPlan = "專項運動";

  // 範例的課表資料，僅在專項運動日有效，
  // 每筆資料中包含 icon (示意圖網址) 與主要活動肌群資料
  const scheduleItems = [
    {
      id: 1,
      name: "Bench Press",
      pr: "80kg",
      setsReps: "3 組 x 8 次",
      icon: "https://via.placeholder.com/40",
      mainMuscle: "Chest",
    },
    {
      id: 2,
      name: "Squat",
      pr: "120kg",
      setsReps: "4 組 x 6 次",
      icon: "https://via.placeholder.com/40",
      mainMuscle: "Legs",
    },
    {
      id: 3,
      name: "Deadlift",
      pr: "150kg",
      setsReps: "3 組 x 5 次",
      icon: "https://via.placeholder.com/40",
      mainMuscle: "Back",
    },
  ];

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 min-w-md w-full mt-4">
      <h2 className="text-lg font-semibold border-b border-gray-200 pb-4 mb-4">
        今日課表
      </h2>

      <ul className="flex flex-col gap-4">
        {scheduleItems.map((item) => (
          <WorkoutScheduleItem key={item.id} {...item} />
        ))}
      </ul>
    </div>
  );
};

type WorkoutScheduleItemProps = {
  id: number;
  name: string;
  pr: string;
  setsReps: string;
  icon: string;
  mainMuscle: string;
};

const WorkoutScheduleItem = ({
  id,
  name,
  pr,
  setsReps,
  icon,
  mainMuscle,
}: WorkoutScheduleItemProps) => {
  // 將 "3 組 x 8 次" 拆解後，交換順序，預設格式為 "組數 x 次數"
  const parts = setsReps.split(" x ");
  const swappedSetsReps =
    parts.length === 2 ? `${parts[1]} x ${parts[0]}` : setsReps;

  return (
    <li>
      <Link
        href={`/workout/${id}`}
        className="block w-full hover:bg-gray-50 transition-colors duration-200"
      >
        <div className="w-full grid grid-cols-[7rem_1fr_10rem] gap-4 items-center">
          {/* 左側：固定尺寸示意圖 */}
          <div>
            <img
              src={"https://placehold.jp/150x150.png"}
              alt={`${name} 示意圖`}
              className="size-28 object-cover rounded"
            />
          </div>
          {/* 中間：放大名稱、主要活動肌群與 PR */}
          <div>
            <p className="text-lg font-bold">{name}</p>
            <p className="text-sm text-gray-600">主要肌群: {mainMuscle}</p>
            <p className="text-xs text-gray-600">PR: {pr}</p>
          </div>
          {/* 右側：交換後的次數與組數資訊 */}
          <div className="border-l border-gray-200 pl-4 h-22 flex items-center">
            <p className="text-sm">{swappedSetsReps}</p>
          </div>
        </div>
      </Link>
    </li>
  );
};

export default WorkoutSchedule;
