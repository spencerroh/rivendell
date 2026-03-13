"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  datasetId: string;
}

export function LogoutButton({ datasetId }: LogoutButtonProps) {
  const router = useRouter();

  function logout() {
    document.cookie = `rivendell_key_${datasetId}=; path=/; max-age=0; SameSite=Lax`;
    router.push("/access");
  }

  return (
    <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
      <LogOut className="h-4 w-4 mr-1.5" />
      로그아웃
    </Button>
  );
}
