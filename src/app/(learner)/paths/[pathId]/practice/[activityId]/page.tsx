import { activityParams } from "@/app/staticParams";
import { PracticePage } from "./View";

export function generateStaticParams() {
  return activityParams();
}

export default function Page() {
  return <PracticePage />;
}
