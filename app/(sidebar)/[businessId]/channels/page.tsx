"use client";

import { Suspense } from "react";
import { ChannelsPageContent } from "@/components/channels/ChannelsPageContent";

export default function ChannelsPage() {
  return (
    <Suspense fallback={null}>
      <ChannelsPageContent />
    </Suspense>
  );
}
