import { useState } from "react";

const classMap: Record<string, string> = {
  error: "bg-destructive/75",
  success: "bg-green-500/50",
};

export const FormFeedbackMessages = (p: { messages: string[]; status: "success" | "error" }) => {
  const [title, ...otherMessages] = p.messages;

  return (
    <div
      className={`mb-4 rounded-md p-3 text-center text-sm text-white ${classMap[p.status] ?? ""}`}
    >
      <div className="text-lg font-bold">{title}</div>
      {otherMessages && otherMessages.map((message, i) => <div key={i}>{message}</div>)}
    </div>
  );
};

export const useFormFeedbackMessages = () => {
  const [messages, setMessages] = useState<string[] | null>(null);
  const [status, setStatus] = useState<"error" | "success">();

  const showError = (messages: string[]) => {
    setMessages(messages);
    setStatus("error");
  };
  const showSuccess = (messages: string[]) => {
    setMessages(messages);
    setStatus("success");
  };
  const clear = () => {
    setMessages(null);
    setStatus(undefined);
  };

  return {
    messages,
    status,
    showError,
    showSuccess,
    clear,
  };
};
