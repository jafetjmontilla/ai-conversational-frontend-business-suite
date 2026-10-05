"use client";

import { Suspense } from "react";
import { AiProfilesPageContent } from "@/components/ai/AiProfilesPageContent";

export default function AiProfilesPage() {
  return (
    <Suspense fallback={null}>
      <AiProfilesPageContent />
    </Suspense>
  );
}
