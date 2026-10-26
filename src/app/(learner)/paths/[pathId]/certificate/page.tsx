import { pathParams } from "@/app/staticParams";
import { CertificatePage } from "./View";

export function generateStaticParams() {
  return pathParams();
}

export default function Page() {
  return <CertificatePage />;
}
