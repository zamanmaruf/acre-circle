"use client";

import { useState, type ComponentProps } from "react";
import { Input } from "./ui";

/**
 * Number field that lets users type freely (e.g. "1." or "") and only commits
 * parseable, in-range values upstream.
 */
export function NumberInput({
  value,
  onCommit,
  min,
  max,
  step = 0.05,
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange" | "min" | "max" | "step"> & {
  value: number;
  onCommit: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const [text, setText] = useState(String(value));
  const [prev, setPrev] = useState(value);
  if (value !== prev) {
    setPrev(value);
    if (Number(text) !== value) setText(String(value));
  }
  const n = Number(text);
  const invalid = text.trim() === "" || Number.isNaN(n) || (min !== undefined && n < min) || (max !== undefined && n > max);
  return (
    <Input
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      max={max}
      value={text}
      invalid={invalid}
      onChange={(e) => {
        setText(e.target.value);
        const v = Number(e.target.value);
        if (e.target.value.trim() !== "" && !Number.isNaN(v) && (min === undefined || v >= min) && (max === undefined || v <= max)) {
          onCommit(v);
        }
      }}
      onBlur={() => {
        if (invalid) setText(String(value));
      }}
      {...props}
    />
  );
}
