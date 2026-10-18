import { conceptParams } from "@/app/staticParams";
import { PreviewExplore } from "./View";

export function generateStaticParams() {
  return conceptParams();
}

export default function Page() {
  return <PreviewExplore />;
}
