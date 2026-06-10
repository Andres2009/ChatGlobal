import ChatLayout from './components/ChatLayout';
import LoginModal from './components/LoginModal';
import ToastContainer from './components/ToastContainer';
import UpdateBanner from './components/UpdateBanner';
import { ChatProvider, useChatContext } from './context/ChatContext';
import { useVersionCheck } from './hooks/useVersionCheck';

function AppContent() {
  const { isJoined, isConnected, rooms, joinChat } = useChatContext();
  const hasUpdate = useVersionCheck();

  return (
    <>
      <UpdateBanner show={hasUpdate} />
      {!isJoined && <LoginModal onJoin={joinChat} isConnected={isConnected} rooms={rooms} />}
      {isJoined && <ChatLayout />}
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}
