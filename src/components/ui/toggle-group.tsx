import * as React from "react";
import { View } from "react-native";
import { toggleTextVariants, toggleVariants } from "./toggle";
import { TextClassContext } from "./text";
import * as ToggleGroupPrimitive from "@rn-primitives/toggle-group";
import { cn } from "../../lib/utils";

interface ToggleGroupContextValue {
  variant?: string;
  size?: string;
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(null);

interface ToggleGroupProps {
  className?: string;
  variant?: string;
  size?: string;
  children: React.ReactNode;
  [key: string]: any;
}

const ToggleGroup = React.forwardRef<View, ToggleGroupProps>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root ref={ref} className={cn("flex flex-row items-center justify-center gap-1", className)} {...props}>
    <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
));
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;
function useToggleGroupContext(): ToggleGroupContextValue {
  const context = React.useContext(ToggleGroupContext);
  if (context === null) {
    throw new Error("ToggleGroup compound components cannot be rendered outside the ToggleGroup component");
  }
  return context;
}

interface ToggleGroupItemProps {
  className?: string;
  children: React.ReactNode;
  variant?: string;
  size?: string;
  value: any;
  disabled?: boolean;
  [key: string]: any;
}

const ToggleGroupItem = React.forwardRef<View, ToggleGroupItemProps>(({ className, children, variant, size, ...props }, ref) => {
  const context = useToggleGroupContext();
  const { value } = ToggleGroupPrimitive.useRootContext();
  return (
    <TextClassContext.Provider
      value={cn(
        toggleTextVariants({ variant, size }),
        ToggleGroupPrimitive.utils.getIsSelected(value, props.value) ? "text-accent-foreground" : "web:group-hover:text-muted-foreground",
      )}
    >
      <ToggleGroupPrimitive.Item
        ref={ref}
        className={cn(
          toggleVariants({
            variant: context.variant || variant,
            size: context.size || size,
          }),
          props.disabled && "web:pointer-events-none opacity-50",
          ToggleGroupPrimitive.utils.getIsSelected(value, props.value) && "bg-accent",
          className,
        )}
        {...props}
      >
        {children}
      </ToggleGroupPrimitive.Item>
    </TextClassContext.Provider>
  );
});
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

interface ToggleGroupIconProps {
  className?: string;
  icon: React.ComponentType<any>;
  [key: string]: any;
}

function ToggleGroupIcon({ className, icon: Icon, ...props }: ToggleGroupIconProps) {
  const textClass = React.useContext(TextClassContext);
  return <Icon className={cn(textClass, className)} {...props} />;
}
export { ToggleGroup, ToggleGroupIcon, ToggleGroupItem, ToggleGroupContext };