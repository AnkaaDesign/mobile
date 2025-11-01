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
  type: "single" | "multiple";
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  disabled?: boolean;
}

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>(({ variant, size, children, type, value, onValueChange, disabled }, ref) => {
  const rootProps = {
    ref,
    type,
    ...(value !== undefined && { value }),
    ...(onValueChange && { onValueChange }),
    ...(disabled !== undefined && { disabled }),
  } as React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>;

  return (
    <ToggleGroupPrimitive.Root {...rootProps}>
      <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
});
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;
function useToggleGroupContext(): ToggleGroupContextValue {
  const context = React.useContext(ToggleGroupContext);
  if (context === null) {
    throw new Error("ToggleGroup compound components cannot be rendered outside the ToggleGroup component");
  }
  return context;
}

interface ToggleGroupItemProps extends Omit<React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>, 'children'> {
  className?: string;
  children: React.ReactNode;
  variant?: string;
  size?: string;
  disabled?: boolean;
}

const ToggleGroupItem = React.forwardRef<View, ToggleGroupItemProps>(({ className, children, variant, size, ...props }, ref) => {
  const context = useToggleGroupContext();
  const { value } = ToggleGroupPrimitive.useRootContext();
  const itemValue = String(props.value ?? '');
  const toggleVariant = (context.variant || variant || 'default') as 'default' | 'outline';
  const toggleSize = (context.size || size || 'default') as 'default' | 'sm' | 'lg';
  const textVariant = (variant || 'default') as 'default' | 'outline';
  const textSize = (size || 'default') as 'default' | 'sm' | 'lg';

  return (
    <TextClassContext.Provider
      value={cn(
        toggleTextVariants({ variant: textVariant, size: textSize }),
        ToggleGroupPrimitive.utils.getIsSelected(value, itemValue) ? "text-accent-foreground" : "web:group-hover:text-muted-foreground",
      )}
    >
      <ToggleGroupPrimitive.Item
        ref={ref}
        className={cn(
          toggleVariants({
            variant: toggleVariant,
            size: toggleSize,
          }),
          props.disabled && "web:pointer-events-none opacity-50",
          ToggleGroupPrimitive.utils.getIsSelected(value, itemValue) && "bg-accent",
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
  icon: React.ComponentType<{ className?: string }>;
}

function ToggleGroupIcon({ className, icon: Icon, ...props }: ToggleGroupIconProps) {
  const textClass = React.useContext(TextClassContext);
  return <Icon className={cn(textClass, className)} {...props} />;
}
export { ToggleGroup, ToggleGroupIcon, ToggleGroupItem, ToggleGroupContext };