import * as AlertDialogPrimitive from "@rn-primitives/alert-dialog";
import * as React from "react";
import { Platform, View , StyleSheet} from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { Button } from "./button";
import { cn } from "../../lib/utils";

interface AlertDialogHeaderProps {
  className?: string;
  children?: React.ReactNode;
}

interface AlertDialogFooterProps {
  className?: string;
  children?: React.ReactNode;
}

interface AlertDialogTitleProps {
  className?: string;
  children?: React.ReactNode;
}

interface AlertDialogDescriptionProps {
  className?: string;
  children?: React.ReactNode;
}

interface AlertDialogActionProps {
  className?: string;
  children?: React.ReactNode;
}

interface AlertDialogCancelProps {
  className?: string;
  children?: React.ReactNode;
}
const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;
const AlertDialogOverlayWeb = React.forwardRef<any, { className?: string }>(({ className, ...props }, ref) => {
  const { open } = AlertDialogPrimitive.useRootContext();
  return (
    <AlertDialogPrimitive.Overlay
      className={cn(
        "z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 absolute top-0 right-0 bottom-0 left-0",
        open ? "web:animate-in web:fade-in-0" : "web:animate-out web:fade-out-0",
        className,
      )}
      {...props}
      ref={ref}
    />
  );
});
AlertDialogOverlayWeb.displayName = "AlertDialogOverlayWeb";

const AlertDialogOverlayNative = React.forwardRef<any, { className?: string; children?: React.ReactNode }>(({ className, children, ...props }, ref) => {
  return (
    <AlertDialogPrimitive.Overlay style={StyleSheet.absoluteFill} className={cn("z-50 flex justify-center items-center p-4", className)} {...props} ref={ref} asChild>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={StyleSheet.flatten([StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0, 0, 0, 0.5)" }])}>
        {children}
      </Animated.View>
    </AlertDialogPrimitive.Overlay>
  );
});
AlertDialogOverlayNative.displayName = "AlertDialogOverlayNative";
const AlertDialogOverlay = Platform.select({
  web: AlertDialogOverlayWeb,
  default: AlertDialogOverlayNative,
});
const AlertDialogContentWeb = React.forwardRef<any, { className?: string; portalHost?: string }>(({ className, portalHost, ...props }, ref) => {
  const { open } = AlertDialogPrimitive.useRootContext();
  return (
    <AlertDialogPortal hostName={portalHost}>
      <AlertDialogOverlay>
        <AlertDialogPrimitive.Content
          ref={ref}
          className={cn(
            "z-50 max-w-md w-full gap-4 border border-gray-200 bg-white p-6 shadow-xl rounded-xl",
            "web:duration-200",
            open ? "web:animate-in web:fade-in-0 web:zoom-in-95" : "web:animate-out web:fade-out-0 web:zoom-out-95",
            className,
          )}
          {...props}
        />
      </AlertDialogOverlay>
    </AlertDialogPortal>
  );
});
AlertDialogContentWeb.displayName = "AlertDialogContentWeb";

const AlertDialogContentNative = React.forwardRef<any, { className?: string; portalHost?: string; children?: React.ReactNode }>(({ className, portalHost, children, ...props }, ref) => {
  return (
    <AlertDialogPortal hostName={portalHost}>
      <AlertDialogOverlay>
        <AlertDialogPrimitive.Content ref={ref} asChild {...props}>
          <Animated.View
            entering={SlideInDown.duration(200).springify()}
            exiting={SlideOutDown.duration(150)}
            style={StyleSheet.flatten([
              {
                backgroundColor: "white",
                borderRadius: 12,
                padding: 24,
                maxWidth: 400,
                width: "90%",
                gap: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 20,
                elevation: 10,
              },
            ])}
            className={className}
          >
            {children}
          </Animated.View>
        </AlertDialogPrimitive.Content>
      </AlertDialogOverlay>
    </AlertDialogPortal>
  );
});
AlertDialogContentNative.displayName = "AlertDialogContentNative";

const AlertDialogContent = Platform.select({
  web: AlertDialogContentWeb,
  default: AlertDialogContentNative,
}) as typeof AlertDialogContentWeb;
const AlertDialogHeader = ({ className, ...props }: AlertDialogHeaderProps) => <View className={cn("flex flex-col gap-2", className)} {...props} />;
AlertDialogHeader.displayName = "AlertDialogHeader";
const AlertDialogFooter = ({ className, ...props }: AlertDialogFooterProps) => <View className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2", className)} {...props} />;
AlertDialogFooter.displayName = "AlertDialogFooter";
const AlertDialogTitle = React.forwardRef<any, AlertDialogTitleProps>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title ref={ref} className={cn("text-lg native:text-xl text-foreground font-semibold", className)} {...props} />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;
const AlertDialogDescription = React.forwardRef<any, AlertDialogDescriptionProps>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description ref={ref} className={cn("text-sm native:text-base text-muted-foreground", className)} {...props} />
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;
const AlertDialogAction = React.forwardRef<any, AlertDialogActionProps>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action ref={ref} {...props} />
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;
const AlertDialogCancel = React.forwardRef<any, AlertDialogCancelProps>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel ref={ref} {...props} />
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};