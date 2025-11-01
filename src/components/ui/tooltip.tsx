import * as TooltipPrimitive from "@rn-primitives/tooltip";
import * as React from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { TextClassContext } from "@/components/ui/text";
import { cn } from "@/lib/utils";

const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

interface TooltipContentProps {
  className?: string;
  sideOffset?: number;
  portalHost?: string;
  [key: string]: any;
}

const TooltipContent = React.forwardRef<View, TooltipContentProps>(({ className, sideOffset = 4, portalHost, ...props }, _ref) => (
  <TooltipPrimitive.Portal hostName={portalHost}>
    <TooltipPrimitive.Overlay style={Platform.OS !== "web" ? StyleSheet.absoluteFill : undefined}>
      <Animated.View entering={Platform.select({ web: undefined, default: FadeIn })} exiting={Platform.select({ web: undefined, default: FadeOut })}>
        <TextClassContext.Provider value="text-sm native:text-base text-popover-foreground">
          <TooltipPrimitive.Content
            className={cn(
              "z-50 overflow-hidden rounded-md border border-neutral-300 bg-popover px-3 py-1.5 shadow-md shadow-foreground/5 web:animate-in web:fade-in-0 web:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
              className,
            )}
            {...props}
          />
        </TextClassContext.Provider>
      </Animated.View>
    </TooltipPrimitive.Overlay>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
export { Tooltip, TooltipContent, TooltipTrigger };