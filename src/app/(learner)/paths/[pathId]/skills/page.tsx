import { pathParams } from "@/app/staticParams";
import { SkillsPage } from "./View";

export function generateStaticParams() {
  return pathParams();
}

export default function Page() {
  return <SkillsPage />;
}
