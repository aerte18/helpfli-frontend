// src/components/ui/CTAButtons.jsx
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "@/components/ui/Button";

export function CTAConcierge({ children = "Diagnozuj z AI", ...props }) {
  const nav = useNavigate();
  return (
    <Button onClick={() => nav("/concierge")} {...props}>
      {children}
    </Button>
  );
}

export function CTACreateOrder({ children = "Stwórz zlecenie", ...props }) {
  const nav = useNavigate();
  return (
    <Button onClick={() => nav("/create-order")} {...props}>
      {children}
    </Button>
  );
}

export function CTASearch({ children = "Zobacz wykonawców", ...props }) {
  const nav = useNavigate();
  return (
    <Button onClick={() => nav("/search")} {...props}>
      {children}
    </Button>
  );
}

export function CTASubscriptions({ children = "Subskrypcje", ...props }) {
  return (
    <Link to="/account/subscriptions">
      <Button as="span" {...props}>{children}</Button>
    </Link>
  );
}

export function CTAWallet({ children = "Płatności", ...props }) {
  return (
    <Link to="/account/wallet">
      <Button as="span" {...props}>{children}</Button>
    </Link>
  );
}

