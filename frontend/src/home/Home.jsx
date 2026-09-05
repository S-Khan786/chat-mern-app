import { useState } from "react";
import Sidebar from "./components/Sidebar";
import MessageContainer from "./components/MessageContainer";

const Home = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setIsSidebarVisible(false);
  };
  const handleShowSidebar = () => {
    setIsSidebarVisible(true);
    setSelectedUser(null);
  };

  return (
    <main className="app-shell glass-panel animate-rise flex h-[calc(100dvh-1rem)] min-h-0 w-full max-w-7xl overflow-hidden rounded-2xl lg:h-[min(860px,calc(100dvh-3rem))] lg:rounded-[1.75rem]">
      <div className={`w-full min-h-0 shrink-0 lg:flex lg:w-[22rem] ${isSidebarVisible ? "" : "hidden"}`}>
        <Sidebar onSelectUser={handleUserSelect} />
      </div>
      <div className="hidden w-px bg-white/10 lg:block" />
      <div className={`min-h-0 min-w-0 flex-1 ${selectedUser ? "" : "hidden lg:flex"}`}>
        <MessageContainer onBackUser={handleShowSidebar} />
      </div>
    </main>
  );
};

export default Home;
