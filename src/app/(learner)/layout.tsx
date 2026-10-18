import { LearnerShell } from "@/learner/LearnerShell";

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return <LearnerShell>{children}</LearnerShell>;
}
