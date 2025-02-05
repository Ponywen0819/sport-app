"use client";

import { WorkoutOverview } from "./components/workout-overview";

export default function Home() {
  return (
    <main className="px-3 py-2 flex flex-col gap-8 items-center sm:items-start">
      <div className="container flex mx-auto">
        {/* 運動天數總覽 */}
        <WorkoutOverview />

        {/* 營養總覽 */}
        <section className="p-4 w-1/3">
          <h2 className="text-xl font-bold">營養總覽</h2>
          <div className="bg-blue-500 p-4 text-white rounded-lg my-2">
            <h3 className="text-lg font-bold">本週營養總攝取</h3>
            <p className="text-4xl font-bold">1500</p>
          </div>
        </section>
      </div>
    </main>
  );
}
