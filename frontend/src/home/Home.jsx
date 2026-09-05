import { useState } from "react";
import Sidebar from "./components/Sidebar";
import MessageContainer from "./components/MessageContainer";

const Home = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const handleUserSelect = (user) => { setSelectedUser(user); setIsSidebarVisible(false); };
  const handleShowSidebar = () => { setIsSidebarVisible(true); setSelectedUser(null); };

  return (
    <main className="app-shell glass-panel flex h-[min(820px,calc(100vh-1.5rem))] w-full max-w-7xl overflow-hidden rounded-[1.75rem] sm:h-[min(820px,calc(100vh-3rem))]">
      <div className={`w-full shrink-0 md:flex md:w-[23rem] ${isSidebarVisible ? "" : "hidden"}`}>
        <Sidebar onSelectUser={handleUserSelect} />
      </div>
      <div className="hidden w-px bg-white/10 md:block" />
      <div className={`min-w-0 flex-1 ${selectedUser ? "" : "hidden md:flex"}`}>
        <MessageContainer onBackUser={handleShowSidebar} />
      </div>
    </main>
  );
};

export default Home;


