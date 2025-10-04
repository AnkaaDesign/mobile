import * as ContextMenuPrimitive from "@rn-primitives/context-menu";
import * as React from "react";
import { Platform, Text, View , StyleSheet} from "react-native";
import Icon from "@/components/ui/icon";
import { cn } from "../../lib/utils";
import { TextClassContext } from "./text";

interface ContextMenuSubTriggerProps {
  className?: string;
  inset?: boolean;
  children?: React.ReactNode;
}

interface ContextMenuSubContentProps {
  className?: string;
  children?: React.ReactNode;
}

interface ContextMenuContentProps {
  className?: string;
  overlayClassName?: string;
  overlayStyle?: any;
  portalHost?: string;
  children?: React.ReactNode;
}

interface ContextMenuItemProps {
  className?: string;
  inset?: boolean;
  children?: React.ReactNode;
  disabled?: boolean;
}

interface ContextMenuCheckboxItemProps {
  className?: string;
  children?: React.ReactNode;
  checked?: boolean;
}

interface ContextMenuRadioItemProps {
  className?: string;
  children?: React.ReactNode;
}

interface ContextMenuLabelProps {
  className?: string;
  inset?: boolean;
  children?: React.ReactNode;
}

interface ContextMenuSeparatorProps {
  className?: string;
}

interface ContextMenuShortcutProps {
  className?: string;
  children?: React.ReactNode;
}
const ContextMenu = ContextMenuPrimitive.Root;
const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
const ContextMenuGroup = ContextMenuPrimitive.Group;
const ContextMenuSub = ContextMenuPrimitive.Sub;
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;
const ContextMenuSubTrigger = React.forwardRef<any, ContextMenuSubTriggerProps>(({ className, inset, children, ...props }, ref) => {
  const { open } = ContextMenuPrimitive.useSubContext();
  const Icon = Platform.OS === "web" ? IconChevronRight : open ? IconChevronUp : IconChevronDown;
  return (
    <TextClassContext.Provider value={cn("select-none text-sm native:text-lg text-primary", open && "native:text-accent-foreground")}>
      <ContextMenuPrimitive.SubTrigger
        ref={ref}
        className={cn(
          "flex flex-row web:cursor-default web:select-none items-center gap-2 web:focus:bg-accent active:bg-accent web:hover:bg-accent rounded-sm px-2 py-1.5 native:py-2 web:outline-none",
          open && "bg-accent",
          inset && "pl-8",
          className,
        )}
        {...props}
      >
        <>{children}</>
        <Icon name="chevron-right" size={18} className="ml-auto text-neutral-800" />
      </ContextMenuPrimitive.SubTrigger>
    </TextClassContext.Provider>
  );
});
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;
const ContextMenuSubContent = React.forwardRef<any, ContextMenuSubContentProps>(({ className, ...props }, ref) => {
  const { open } = ContextMenuPrimitive.useSubContext();
  return (
    <ContextMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border mt-1 border-neutral-300 bg-popover p-1 shadow-md shadow-foreground/5 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        open ? "web:animate-in web:fade-in-0 web:zoom-in-95" : "web:animate-out web:fade-out-0 web:zoom-out",
        className,
      )}
      {...props}
    />
  );
});
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;
const ContextMenuContent = React.forwardRef<any, ContextMenuContentProps>(({ className, overlayClassName, overlayStyle, portalHost, ...props }, ref) => {
  const { open } = ContextMenuPrimitive.useRootContext();
  return (
    <ContextMenuPrimitive.Portal hostName={portalHost}>
      <ContextMenuPrimitive.Overlay
        style={
          overlayStyle
            ? StyleSheet.flatten([Platform.OS !== "web" ? StyleSheet.absoluteFill : undefined, overlayStyle])
            : Platform.OS !== "web"
              ? StyleSheet.absoluteFill
              : undefined
        }
        className={overlayClassName}
      >
        <ContextMenuPrimitive.Content
          ref={ref}
          className={cn(
            "z-50 min-w-[8rem] overflow-hidden rounded-md border border-neutral-300 bg-popover p-1 shadow-md shadow-foreground/5 web:data-[side=bottom]:slide-in-from-top-2 web:data-[side=left]:slide-in-from-right-2 web:data-[side=right]:slide-in-from-left-2 web:data-[side=top]:slide-in-from-bottom-2",
            open ? "web:animate-in web:fade-in-0 web:zoom-in-95" : "web:animate-out web:fade-out-0 web:zoom-out-95",
            className,
          )}
          {...props}
        />
      </ContextMenuPrimitive.Overlay>
    </ContextMenuPrimitive.Portal>
  );
});
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;
const ContextMenuItem = React.forwardRef<any, ContextMenuItemProps>(({ className, inset, ...props }, ref) => (
  <TextClassContext.Provider value="select-none text-sm native:text-lg text-popover-foreground web:group-focus:text-accent-foreground">
    <ContextMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex flex-row web:cursor-default items-center gap-2 rounded-sm px-2 py-1.5 native:py-2 web:outline-none web:focus:bg-accent active:bg-accent web:hover:bg-accent group",
        inset && "pl-8",
        props.disabled && "opacity-50 web:pointer-events-none",
        className,
      )}
      {...props}
    />
  </TextClassContext.Provider>
));
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;
const ContextMenuCheckboxItem = React.forwardRef<any, ContextMenuCheckboxItemProps>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex flex-row web:cursor-default items-center web:group rounded-sm py-1.5 native:py-2 pl-8 pr-2 web:outline-none web:focus:bg-accent active:bg-accent",
      props.disabled && "web:pointer-events-none opacity-50",
      className,
    )}
    {...props}
  >
    <View className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Icon name="check" size={14} className="text-neutral-800" />
      </ContextMenuPrimitive.ItemIndicator>
    </View>
    <>{children}</>
  </ContextMenuPrimitive.CheckboxItem>
));
ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName;
const ContextMenuRadioItem = React.forwardRef<any, ContextMenuRadioItemProps>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex flex-row web:cursor-default web:group items-center rounded-sm py-1.5 native:py-2 pl-8 pr-2 web:outline-none web:focus:bg-accent active:bg-accent",
      props.disabled && "web:pointer-events-none opacity-50",
      className,
    )}
    {...props}
  >
    <View className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <View className="bg-foreground h-2 w-2 rounded-full" />
      </ContextMenuPrimitive.ItemIndicator>
    </View>
    <>{children}</>
  </ContextMenuPrimitive.RadioItem>
));
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;
const ContextMenuLabel = React.forwardRef<any, ContextMenuLabelProps>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm native:text-base font-semibold text-neutral-800 web:cursor-default", inset && "pl-8", className)}
    {...props}
  />
));
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;
const ContextMenuSeparator = React.forwardRef<any, ContextMenuSeparatorProps>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
));
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;
const ContextMenuShortcut = ({ className, ...props }: ContextMenuShortcutProps) => {
  return <Text className={cn("ml-auto text-xs native:text-sm tracking-widest text-muted-foreground", className)} {...props} />;
};
ContextMenuShortcut.displayName = "ContextMenuShortcut";
export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
};
