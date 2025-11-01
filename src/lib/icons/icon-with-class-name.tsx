import { cssInterop } from "nativewind";
export function iconWithClassName(icon: any /* TODO: Add proper type */) {
  cssInterop(icon, {
    className: {
      target: "style",
      nativeStyleToProp: {
        color: true,
        opacity: true,
      },
    },
  });
}
