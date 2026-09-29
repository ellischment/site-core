import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "ghost" | "danger";

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  small?: boolean;
  className?: string;
};

type ButtonProps = CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

type LinkProps = CommonProps & {
  href: string;
  ariaLabel?: string;
  external?: boolean;
};

export function buttonClass(variant: Variant = "primary", small = false, extra?: string): string {
  const list = [styles.button, styles[variant]];
  if (small) list.push(styles.small);
  if (extra) list.push(extra);
  return list.join(" ");
}

export function Button({ children, variant = "primary", small = false, className, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, small, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({ children, href, variant = "primary", small = false, className, ariaLabel, external }: LinkProps) {
  if (external) {
    return (
      <a href={href} className={buttonClass(variant, small, className)} aria-label={ariaLabel} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={buttonClass(variant, small, className)} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
