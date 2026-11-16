import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonStyles = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out-expo active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-on-brand shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_1px_2px_rgb(15_23_41/0.18),0_0_0_1px_var(--brand)] hover:bg-brand-hover",
        secondary:
          "border border-line-strong bg-surface text-ink shadow-xs hover:border-line-strong hover:bg-subtle",
        ghost: "text-ink-2 hover:bg-subtle hover:text-ink",
        soft: "bg-brand-soft text-brand-ink hover:bg-brand-soft/70",
        danger: "bg-bad text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.16)] hover:opacity-90 dark:text-canvas",
        ink: "bg-ink text-inverse shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] hover:opacity-90",
      },
      size: {
        xs: "h-7 rounded-md px-2.5 text-[12px] [&_svg]:size-3.5",
        sm: "h-8 rounded-lg px-3 text-[13px]",
        md: "h-9 rounded-lg px-3.5 text-[13.5px]",
        lg: "h-10 rounded-[10px] px-4 text-[14px]",
        icon: "size-8 rounded-lg",
        "icon-sm": "size-7 rounded-md [&_svg]:size-3.5",
      },
    },
    defaultVariants: { variant: "secondary", size: "sm" },
  },
);

type Props = ComponentProps<"button"> & VariantProps<typeof buttonStyles> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, type, ...props }: Props) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" data-variant={variant ?? "secondary"} type={asChild ? undefined : (type ?? "button")} className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}
