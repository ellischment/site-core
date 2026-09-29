import { config } from "@/lib/config";
import { RequestForm, type RequestFormProps } from "./RequestForm";

/** Серверная обёртка формы: каналы и вид обращения из конфига. */
export function RequestBlock(props: Partial<RequestFormProps>) {
  const settings = config.modules.requests;
  if (!settings) return null;
  return <RequestForm kind={props.kind ?? settings.kinds[0].id} channels={settings.channels} {...props} />;
}
