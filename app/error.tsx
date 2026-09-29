"use client";

import { useEffect } from "react";
import { Button } from "@/components/Button";
import { StatusPage } from "@/components/StatusPage";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage code="500" title="Что-то пошло не так" text="Мы уже видим ошибку в журнале. Попробуйте ещё раз через минуту.">
      <Button onClick={() => reset()}>Попробовать снова</Button>
    </StatusPage>
  );
}
