import { ButtonLink } from "@/components/Button";
import { StatusPage } from "@/components/StatusPage";

export default function NotFound() {
  return (
    <StatusPage code="404" title="Такой страницы нет" text="Возможно, адрес изменился или в нём опечатка.">
      <ButtonLink href="/">На главную</ButtonLink>
    </StatusPage>
  );
}
