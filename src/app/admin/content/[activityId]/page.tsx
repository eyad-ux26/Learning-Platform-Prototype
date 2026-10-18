import { flagshipActivityParams } from "@/app/staticParams";
import { ActivityEditorPage } from "./View";

export function generateStaticParams() {
  return flagshipActivityParams();
}

export default function Page() {
  return <ActivityEditorPage />;
}
