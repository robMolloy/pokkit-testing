import React from "react";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ShadCnTextarea } from "../ui/textarea";

type TInputParams = Parameters<typeof Input>[0];

export const TextInput = ({
  onInput,
  value,
  ...p
}: Omit<TInputParams, "type" | "onInput" | "value"> & {
  value: string;
  type?: "text" | "password" | "email";
  onInput: (x: string) => void;
}) => {
  const [internalValue, setInternalValue] = React.useState(value);

  React.useEffect(() => onInput(internalValue), [internalValue]);
  React.useEffect(() => setInternalValue(value), [value]);

  return (
    <Input
      type={p.type ?? "text"}
      {...p}
      value={internalValue}
      onInput={(e) => {
        const newValue = (e.target as unknown as { value: string }).value;
        setInternalValue(newValue);
      }}
    />
  );
};

export const FileInput = ({
  onInput,
  value,
  ...p
}: Omit<TInputParams, "type" | "onInput" | "value"> & {
  value: File | undefined;
  onInput: (x: File | undefined) => void;
}) => {
  const [internalValue, setInternalValue] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => setInternalValue(value), [value]);
  React.useEffect(() => onInput(internalValue), [internalValue]);

  React.useEffect(() => {
    if (inputRef.current && !internalValue) inputRef.current.value = "";
  }, [internalValue]);

  return (
    <Input
      {...p}
      type="file"
      ref={inputRef}
      onInput={(e) => {
        const file = (e.target as unknown as { files: File[] }).files[0];
        onInput(file);
      }}
    />
  );
};

export const NumberInput = ({
  onInput,
  value,
  ...p
}: Omit<TInputParams, "type" | "onInput" | "value"> & {
  value: number;
  onInput: (x: number) => void;
}) => {
  const [internalValue, setInternalValue] = React.useState<number>(value);

  React.useEffect(() => {
    onInput(internalValue);
  }, [internalValue]);
  React.useEffect(() => {
    setInternalValue(value);
  }, [value]);

  return (
    <Input
      {...p}
      value={`${internalValue}`}
      onInput={(e) => {
        const newStr = (e.target as unknown as { value: string }).value;

        const numStr = newStr.replace(/[^0-9]/g, "");
        if (newStr !== numStr) return;
        const num = numStr ? parseInt(numStr) : 0;
        setInternalValue(num);
      }}
    />
  );
};

export const SimpleSelect = (p: {
  value: string;
  onValueChange: (x: string) => void;
  options: { name: string; value: string }[];
  placeholder: string;
}) => {
  return (
    <Select value={p.value} onValueChange={(x) => p.onValueChange(x)}>
      <SelectTrigger>
        <SelectValue placeholder={p.placeholder} />
      </SelectTrigger>
      <SelectContent>
        {p.options.map((x) => (
          <SelectItem key={x.name} value={x.value}>
            {x.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

type TShadCnTextareaProps = React.ComponentProps<typeof ShadCnTextarea>;
type TTextareaProps = Omit<TShadCnTextareaProps, "onInput"> & { onInput: (x: string) => void };
export const Textarea = ({ onInput, ...p }: TTextareaProps) => {
  return (
    <ShadCnTextarea
      {...p}
      onInput={(e) => {
        const value = (e.target as unknown as { value: string }).value;
        onInput(value);
      }}
    />
  );
};
