"use client";

import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MessageButton() {
  return (
    <Button
      size="lg"
      onClick={() => toast("Messaging coming soon")}
      className="w-full sm:w-auto"
    >
      <MessageCircle className="size-4" />
      Send a Message
    </Button>
  );
}
