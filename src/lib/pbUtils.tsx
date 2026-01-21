import { toast } from "sonner";
import { z } from "zod";

export const toastMultiMessages = (messages: string[]) => {
  const [message1, ...otherMessages] = messages;

  toast(message1, {
    description: otherMessages ? (
      <div>
        {otherMessages.map((message) => (
          <div key={message}>{message}</div>
        ))}
      </div>
    ) : undefined,
  });
};

const outerSchema = z.record(z.string(), z.unknown());
const innerSchema = outerSchema;
const messageObjSchema = z.object({ message: z.string() });
const errorSchema = z.object({
  message: z.string().optional(),
  response: z.object({
    data: outerSchema.transform((outerObj) => {
      const messages: string[] = [];

      Object.values(outerObj)
        .map((innerObj) => {
          const innerParsed = innerSchema.safeParse(innerObj);
          return innerParsed.success ? innerParsed.data : null;
        })
        .filter((val) => !!val)
        .map((innerObj) => {
          return Object.values(innerObj)
            .map((messageObj) => {
              const messageObjParsed = messageObjSchema.safeParse(messageObj);
              return messageObjParsed.success ? messageObjParsed.data : null;
            })
            .filter((val) => !!val);
        })
        .forEach((outerValue) => {
          outerValue.forEach((messageObj) => {
            messages.push(messageObj.message);
          });
        });

      return { messages };
    }),
  }),
});

export const extractMessageFromPbError = (p: { error: unknown }) => {
  const parsed = errorSchema.safeParse(p.error);

  if (!parsed.success) return;

  const initMessages = parsed.data.response.data.messages;
  const messageAsArray = parsed.data.message ? [parsed.data.message] : [];
  const messages = [...messageAsArray, ...initMessages];

  if (messages.length === 0) return;
  return messages;
};
