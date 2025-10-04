import * as React from "react";
import { Modal, Platform, Pressable, Text, TextStyle, View, ViewStyle } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { IconX } from "@tabler/icons-react-native";

// Dialog Context
interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue>({
  open: false,
  onOpenChange: () => {},
});

// Dialog Root
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open = false, onOpenChange = () => {}, children }) => {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>;
};

// Dialog Trigger
interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const DialogTrigger: React.FC<DialogTriggerProps> = ({ children, asChild }) => {
  const { onOpenChange } = React.useContext(DialogContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onPress: () => onOpenChange(true),
    });
  }

  return <Pressable onPress={() => onOpenChange(true)}>{children}</Pressable>;
};

// Dialog Portal (simplified for React Native)
export const DialogPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Dialog Close
interface DialogCloseProps {
  children?: React.ReactNode;
  asChild?: boolean;
}

export const DialogClose: React.FC<DialogCloseProps> = ({ children, asChild }) => {
  const { onOpenChange } = React.useContext(DialogContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onPress: () => onOpenChange(false),
    });
  }

  return <Pressable onPress={() => onOpenChange(false)}>{children}</Pressable>;
};

// Dialog Overlay
const DialogOverlay: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const overlayStyles: ViewStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    ...style,
  };

  return <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={overlayStyles} />;
};

// Dialog Content
interface DialogContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
  showCloseButton?: boolean;
}

export const DialogContent = React.forwardRef<View, DialogContentProps>(({ children, style, showCloseButton = true }, ref) => {
  const { open, onOpenChange } = React.useContext(DialogContext);

  const contentStyles: ViewStyle = {
    maxWidth: 500,
    width: "100%",
    gap: 16,
    borderWidth: 1,
    borderColor: "#d4d4d4",
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 8,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    ...style,
  };

  const closeButtonStyles: ViewStyle = {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 2,
    borderRadius: 4,
    opacity: 0.7,
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => onOpenChange(false)}>
      <Pressable style={{ flex: 1 }} onPress={() => onOpenChange(false)}>
        <DialogOverlay />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View ref={ref} entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={contentStyles}>
              {children}
              {showCloseButton && (
                <Pressable style={closeButtonStyles} onPress={() => onOpenChange(false)}>
                  <IconX size={Platform.OS === "web" ? 16 : 18} color="#737373" />
                </Pressable>
              )}
            </Animated.View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
});

DialogContent.displayName = "DialogContent";

// Dialog Header
export const DialogHeader: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => {
  const headerStyles: ViewStyle = {
    flexDirection: "column",
    gap: 6,
    ...style,
  };

  return <View style={headerStyles}>{children}</View>;
};

// Dialog Footer
export const DialogFooter: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => {
  const footerStyles: ViewStyle = {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    ...style,
  };

  return <View style={footerStyles}>{children}</View>;
};

// Dialog Title
export const DialogTitle = React.forwardRef<Text, { children: React.ReactNode; style?: TextStyle }>(({ children, style }, ref) => {
  const titleStyles: TextStyle = {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
    color: "#171717",
    ...style,
  };

  return (
    <Text ref={ref} style={titleStyles}>
      {children}
    </Text>
  );
});

DialogTitle.displayName = "DialogTitle";

// Dialog Description
export const DialogDescription = React.forwardRef<Text, { children: React.ReactNode; style?: TextStyle }>(({ children, style }, ref) => {
  const descriptionStyles: TextStyle = {
    fontSize: 14,
    lineHeight: 20,
    color: "#737373",
    ...style,
  };

  return (
    <Text ref={ref} style={descriptionStyles}>
      {children}
    </Text>
  );
});

DialogDescription.displayName = "DialogDescription";
