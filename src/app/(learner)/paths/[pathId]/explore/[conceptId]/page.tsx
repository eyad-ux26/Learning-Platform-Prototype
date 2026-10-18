import { conceptParams } from "@/app/staticParams";
import { ExplorePage } from "./View";

export function generateStaticParams() {
  return conceptParams();
}

export default function Page() {
  return <ExplorePage />;
}
