import React from "react";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/animate-ui/radix/hover-card";

interface EnhancedTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  title?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  sideOffset?: number;
  className?: string;
}

export const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  children,
  content,
  title,
  side = "top",
  align = "center",
  delayDuration = 200,
  sideOffset = 5,
  className = ""
}) => {
  return (
    <HoverCard openDelay={delayDuration} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={`z-50 max-w-xs p-3 text-sm bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}
      >
        {title && (
          <div className="font-semibold text-gray-900 mb-1">{title}</div>
        )}
        <div className="text-gray-600">{content}</div>
      </HoverCardContent>
    </HoverCard>
  );
};

// Quick tooltip for simple text
interface QuickTooltipProps {
  children: React.ReactNode;
  text: string;
  side?: "top" | "right" | "bottom" | "left";
}

export const QuickTooltip: React.FC<QuickTooltipProps> = ({ 
  children, 
  text, 
  side = "top" 
}) => {
  return (
    <EnhancedTooltip
      content={text}
      side={side}
      className="text-xs"
    >
      {children}
    </EnhancedTooltip>
  );
};

// Info tooltip with icon
interface InfoTooltipProps {
  content: React.ReactNode;
  title?: string;
  side?: "top" | "right" | "bottom" | "left";
  iconClassName?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  title,
  side = "top",
  iconClassName = "w-4 h-4 text-gray-400 hover:text-gray-600"
}) => {
  return (
    <EnhancedTooltip
      content={content}
      title={title}
      side={side}
    >
      <button
        type="button"
        className="inline-flex items-center justify-center transition-colors cursor-help"
      >
        <svg
          className={iconClassName}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </EnhancedTooltip>
  );
};