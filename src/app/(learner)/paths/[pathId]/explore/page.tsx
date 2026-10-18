import { pathParams } from "@/app/staticParams";
import { ExploreIndex } from "./View";

export function generateStaticParams() {
  return pathParams();
}

export default function Page() {
  return <ExploreIndex />;
}
