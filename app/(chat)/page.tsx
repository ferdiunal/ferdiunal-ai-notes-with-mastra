import { uuidv7 } from "uuidv7";
import Chat from "../chat";

export default async function Home() {
  const id = uuidv7();
  
  return (
      <Chat id={id} initialMessages={[]} autoResume={false} />
  );
}
