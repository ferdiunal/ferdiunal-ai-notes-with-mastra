import { CopyIcon, Loader2Icon } from "lucide-react";
import { useTransition } from "react";
import { Action } from "./actions";

export const CopyButton = ({ text }: { text: string }) => {
//   const [isCopying, startCopying] = useState(false);
const [isCopying, startCopying] = useTransition();

  const handleCopy = () => {
    if (isCopying) return;

    startCopying(async () => {
        await Promise.allSettled([
            new Promise((resolve) => setTimeout(resolve, 300)),
            navigator.clipboard.writeText(text)
        ])
    });
    // startCopying(true);
    // setTimeout(() => {
    //   navigator.clipboard.writeText(text).finally(() => {
    //     startCopying(false);
    //   });
    // }, 300);
  };

  return (
    <Action onClick={handleCopy} label="Copy" disabled={isCopying}>
      {isCopying ? (
        <Loader2Icon className="size-3 animate-spin" />
      ) : (
        <CopyIcon className="size-3" />
      )}
    </Action>
  );
};
