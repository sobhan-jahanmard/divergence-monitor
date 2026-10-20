"use client";
import { Button } from "./ui";
export function RetryButton() {
  return (
    <Button variant="outline" onClick={() => window.location.reload()}>
      تلاش دوباره
    </Button>
  );
}
