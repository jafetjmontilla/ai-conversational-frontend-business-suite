"use client";

import type { Business } from "@/lib/interfases";
import { CreateBusinessForm } from "@/components/business/CreateBusinessForm";
import { EditBusinessForm } from "@/components/business/EditBusinessForm";

interface BusinessFormCreateEditProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  business?: Business | null;
}

export default function BusinessFormCreateEdit({
  isOpen,
  onClose,
  onSuccess,
  business,
}: BusinessFormCreateEditProps) {
  if (!isOpen) return null;

  if (business) {
    return (
      <EditBusinessForm
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={onSuccess}
        business={business}
      />
    );
  }

  return <CreateBusinessForm isOpen={isOpen} onClose={onClose} onSuccess={onSuccess} />;
}
