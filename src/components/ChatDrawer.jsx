import { useChatStore } from "../store/chatStore";
import { useAuth } from "../context/AuthContext";
import ChatPanel from "./ChatPanel";

export default function ChatDrawer() {
  const { isOpen, orderId, mode, prefill, close, provider } = useChatStore();
  const { token, user } = useAuth();

  if (!isOpen || !token) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="absolute right-0 top-0 h-full w-full md:w-[480px] bg-white shadow-2xl">
        <ChatPanel
          open={isOpen}
          onClose={close}
          peerId={provider?._id || provider?.id}
          roomId={orderId ? `order:${orderId}` : null}
          authToken={token}
          selfUser={user}
        />
      </div>
    </div>
  );
}
