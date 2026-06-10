import ChatLayout from './components/ChatLayout';
import LoginModal from './components/LoginModal';
import ToastContainer from './components/ToastContainer';
import { ChatProvider, useChatContext } from './context/ChatContext';

function AppContent() {
  const { isJoined, isConnected, joinChat } = useChatContext();

  return (
    <>
      {!isJoined && <LoginModal onJoin={joinChat} isConnected={isConnected} />}
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
