"use client";

import dynamic from "next/dynamic";

const RobotViewer = dynamic(() => import("@/components/robot-viewer"), { ssr: false });

export default function ClientRobotViewer({ className = "" }: { className?: string }) {
  return <RobotViewer className={className} />;
}
