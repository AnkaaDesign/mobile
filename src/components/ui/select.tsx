import * as SelectPrimitive from "@rn-primitives/select";
import * as React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {  FadeIn, FadeOut  } from "react-native-reanimated";
import Icon from "@/components/ui/icon";
import { cn } from "../../lib/utils";

type Option = {
  value: string;
  label: string;
};

interface SelectRootProps extends Omit<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>, "value" | "onValueChange"> {
  value?: string | Option;
  onValueChange?: (value: string) => void;
  options?: Option[];
  placeholder?: string;
}

const SelectRoot = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Root>, SelectRootProps>(({ value, onValueChange, ...props }, ref) => {
  // Convert string value to Option format for the primitive
  const optionValue = React.useMemo(() => {
    if (!value) return undefined;
    if (typeof value === "string") {
      // For string values, we'll use the string as both value and label
      // The actual label will come from the SelectItem components
      return { value, label: value };
    }
    return value;
  }, [value]);

  // Handle value change by extracting the string value from Option
  const handleValueChange = React.useCallback(
    (option: Option | undefined) => {
      onValueChange?.(option?.value || "");
    },
    [onValueChange],
  );

  return <SelectPrimitive.Root ref={ref} value={optionValue} onValueChange={handleValueChange} {...props} />;
});

SelectRoot.displayName = "Select";

const Select = SelectRoot;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;
const SelectTrigger = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-row h-10 native:h-12 items-center text-sm justify-between rounded-md border border-border bg-input px-3 py-2 web:ring-offset-background text-foreground web:focus:outline-none web:focus:ring-2 web:focus:ring-ring web:focus:ring-offset-2 [&>span]:line-clamp-1",
        props.disabled && "web:cursor-not-allowed opacity-50",
        className,
      )}
      {...props}
    >
      <>{children}</>
      <Icon name="IconChevronDown" size={16} className="text-mutedForeground opacity-50" />
    </SelectPrimitive.Trigger>
  ),
);
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
/**
 * Platform: WEB ONLY
 */
const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => {
  if (Platform.OS !== "web") {
    return null;
  }
  return (
    <SelectPrimitive.ScrollUpButton ref={ref} className={cn("flex web:cursor-default items-center justify-center py-1", className)} {...props}>
      <Icon name="IconChevronUp" size={14} className="text-foreground" />
    </SelectPrimitive.ScrollUpButton>
  );
});
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

/**
 * Platform: WEB ONLY
 */
const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => {
  if (Platform.OS !== "web") {
    return null;
  }
  return (
    <SelectPrimitive.ScrollDownButton ref={ref} className={cn("flex web:cursor-default items-center justify-center py-1", className)} {...props}>
      <Icon name="IconChevronDown" size={14} className="text-foreground" />
    </SelectPrimitive.ScrollDownButton>
  );
});
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    portalHost?: string;
  }
>(({ className, children, position = "popper", portalHost, ...props }, ref) => {
  const { open } = SelectPrimitive.useRootContext();
  return (
    <SelectPrimitive.Portal hostName={portalHost}>
      <SelectPrimitive.Overlay style={Platform.OS !== "web" ? StyleSheet.absoluteFill : undefined}>
        <Animated.View className="z-50" entering={FadeIn} exiting={FadeOut}>
          <SafeAreaView>
            <SelectPrimitive.Content
              ref={ref}
              className={cn(
                "relative z-50 max-h-96 min-w-[8rem] rounded-md border border-border bg-popover shadow-md py-2 px-1 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
                open ? "web:zoom-in-95 web:animate-in web:fade-in-0" : "web:zoom-out-95 web:animate-out web:fade-out-0",
                className,
              )}
              position={position}
              {...props}
            >
              <SelectScrollUpButton />
              <SelectPrimitive.Viewport className={cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}>
                {children}
              </SelectPrimitive.Viewport>
              <SelectScrollDownButton />
            </SelectPrimitive.Content>
          </SafeAreaView>
        </Animated.View>
      </SelectPrimitive.Overlay>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = SelectPrimitive.Content.displayName;
const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label ref={ref} className={cn("py-1.5 native:pb-2 pl-8 native:pl-10 pr-2 text-foreground text-sm native:text-base font-semibold", className)} {...props} />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
interface SelectItemProps extends Omit<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>, "label"> {
  value: string;
  label?: string;
  children?: React.ReactNode;
}

const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, SelectItemProps>(({ className, children, value, label, ...props }, ref) => {
  // Use provided label or extract from children
  const itemLabel = label || (typeof children === "string" ? children : "");

  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative web:group flex flex-row w-full web:cursor-default web:select-none border-b border-border items-center rounded-sm py-1.5 native:py-2 pl-8 native:pl-10 pr-2 web:hover:bg-accent/50 active:bg-accent web:outline-none web:focus:bg-accent",
        props.disabled && "web:pointer-events-none opacity-50",
        className,
      )}
      {...props}
      value={value}
      label={itemLabel}
    >
      <View className="absolute left-2 native:left-3.5 flex h-3.5 native:pt-px w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Icon name="IconCheck" size={16} className="text-foreground" />
        </SelectPrimitive.ItemIndicator>
      </View>
      <SelectPrimitive.ItemText className="text-sm native:text-lg text-foreground native:text-base web:group-focus:text-accent-foreground">{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = SelectPrimitive.Item.displayName;
const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue, SelectRoot };
