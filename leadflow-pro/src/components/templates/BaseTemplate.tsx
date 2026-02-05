import { HandwerkTemplate, TemplateProps } from "./HandwerkTemplate";
import { BeautyTemplate } from "./BeautyTemplate";
import { TechTemplate } from "./TechTemplate";

export type TemplateType = "handwerk" | "beauty" | "tech";

interface BaseTemplateProps extends TemplateProps {
  type: TemplateType;
}

export function BaseTemplate({ type, ...props }: BaseTemplateProps) {
  switch (type) {
    case "handwerk":
      return <HandwerkTemplate {...props} />;
    case "beauty":
      return <BeautyTemplate {...props} />;
    case "tech":
      return <TechTemplate {...props} />;
    default:
      return <HandwerkTemplate {...props} />;
  }
}
