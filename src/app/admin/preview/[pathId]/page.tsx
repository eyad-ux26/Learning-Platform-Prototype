import { pathParams } from "@/app/staticParams";
import { PreviewOverview } from "./View";

export function generateStaticParams() {
  return pathParams();
}

export default function Page() {
  return <PreviewOverview />;
}
