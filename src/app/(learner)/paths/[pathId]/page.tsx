import { pathParams } from "@/app/staticParams";
import { PathPage } from "./View";

export function generateStaticParams() {
  return pathParams();
}

export default function Page() {
  return <PathPage />;
}
