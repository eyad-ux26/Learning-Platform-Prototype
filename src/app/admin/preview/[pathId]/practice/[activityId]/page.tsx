import { activityParams } from "@/app/staticParams";
import { PreviewPractice } from "./View";

export function generateStaticParams() {
  return activityParams();
}

export default function Page() {
  return <PreviewPractice />;
}
