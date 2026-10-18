import { pathParams } from "@/app/staticParams";
import { PathEditorPage } from "./View";

export function generateStaticParams() {
  return pathParams();
}

export default function Page() {
  return <PathEditorPage />;
}
