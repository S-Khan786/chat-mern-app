import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { IoArrowBackSharp } from "react-icons/io5";
import { BiLogOut } from "react-icons/bi";
import userConversation from "../../Zustans/useConversation.jsx";
import { useSocketContext } from "../../context/socketContext.jsx";

function Sidebar({ onSelectUser }) {
  const navigate = useNavigate();
  const { authUser, setAuthUser } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [searchUser, setSearchUser] = useState([]);
  const [chatUser, setChatUser] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newMessageUsers, setNewMessageUsers] = useState('');
  const {onlineUser, socket} = useSocketContext();

  const {
    messages,
    selectedConversation,
    setSelectedConversation,
  } = userConversation();


  const nowOnline = chatUser.map((user) => user._id); // List of user IDs in chat
  const isOnline = nowOnline.map((userId) => onlineUser.includes(userId)); // Checks if each user ID is online
  

  useEffect(() => {
    socket?.on("newMessage", (newMessage) => {
      setNewMessageUsers(newMessage)
    });
    return () => socket?.off("newMessage");
  }, [socket, messages]);
  

  //show user with u chatted
  useEffect(() => {
    const chatUserHandler = async () => {
      setLoading(true);
      try {
        const chatters = await axios.get(`/api/user/currentchatters`);
        const data = chatters.data;
        if (data.success === false) {
          setLoading(false);
          console.log(data.message);
        }
        setLoading(false);
        setChatUser(data);
      } catch (err) {
        setLoading(false);
        console.log(err);
      }
    };
    chatUserHandler();
  }, []);

  // console.log(ser);

  //show user from the search result
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const search = await axios.get(`/api/user/search?search=${searchInput}`);
      const data = search.data;
      if (data.success === false) {
        setLoading(false);
        console.log(data.message);
      }
      setLoading(false);
      if (data.length === 0) {
        toast.info("User not found");
      } else {
        setSearchUser(data);
      }
    } catch (err) {
      setLoading(false);
      console.log(err);
    }
  };

  //show which user is selected
  const handleUserClick = (user) => {
    onSelectUser(user);
    setSelectedConversation(user);
    setSelectedUserId(user._id);
    setNewMessageUsers('');
  };

  //back from search result
  const handSearchback = () => {
    setSearchUser([]);
    setSearchInput("");
  };

  //logout
  const handleLogOut = async () => {
    const confirmlogout = window.prompt("type 'UserName' To LOGOUT");
    if (confirmlogout === authUser.username) {
      setLoading(true);
      try {
        const logout = await axios.post("/api/auth/logout");
        const data = logout.data;
        if (data?.success === false) {
          setLoading(false);
          console.log(data?.message);
        }
        toast.info(data?.message);
        localStorage.removeItem("chatapp");
        setAuthUser(null);
        setLoading(false);
        navigate("/login");
      } catch (error) {
        setLoading(false);
        console.log(error);
      }
    } else {
      toast.info("LogOut Cancelled");
    }
  };

  console.log(searchUser);
  return (
    <div className="h-full w-auto px-1">
      <div className="flex justify-between gap-2">
        <form
          onSubmit={handleSearchSubmit}
          className="w-auto flex items-center justify-between bg-white rounded-full "
        >
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            type="text"
            placeholder="search user"
            className="px-4 w-auto bg-transparent outline-none rounded-full text-black"
          />
          <button className="btn btn-circle bg-sky-700 hover:bg-gray-950">
            <FaSearch />
          </button>
        </form>
        <img
          onClick={() => navigate(`/profile/${authUser?._id}`)}
          src={authUser?.profilePic}
          className="self-center h-12 w-12 hover:scale-110 cursor-pointer"
        />
      </div>
      <div className="divider px-3"></div>
      {searchUser?.length > 0 ? (
        <>
          <div className="min-h-[70%] max-h-[80%] m overflow-y-auto scrollbar ">
            <div className="w-auto">
              {searchUser.map((user, index) => (
                <div key={user._id}>
                  <div
                    onClick={() => handleUserClick(user)}
                    className={`flex gap-3 
                                                items-center rounded 
                                                p-2 py-1 cursor-pointer
                                                ${
                                                  selectedUserId === user?._id
                                                    ? "bg-sky-500"
                                                    : ""
                                                } `}
                  >
                    {/*Socket is Online*/}
                    <div
                      className={`avatar ${isOnline[index] ? "online" : ""}`}
                    >
                      <div className="w-12 rounded-full">
                        <img src={user.profilePic} alt="user.img" />
                      </div>
                    </div>
                    <div className="flex flex-col flex-1">
                      <p className="font-bold text-gray-950">{user.username}</p>
                    </div>
                  </div>
                  <div className="divider divide-solid px-3 h-[1px]"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto px-1 py-1 flex">
            <button
              onClick={handSearchback}
              className="bg-white rounded-full px-2 py-1 self-center text-black"
            >
              <IoArrowBackSharp size={25} />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="min-h-[70%] max-h-[80%] m overflow-y-auto scrollbar ">
            <div className="w-auto">
              {chatUser.length === 0 ? (
                <>
                  <div className="font-bold items-center flex flex-col text-xl text-yellow-500">
                    <h1>Why are you Alone!!🤔</h1>
                    <h1>Search username to chat</h1>
                  </div>
                </>
              ) : (
                <>
                  {chatUser.map((user, index) => (
                    <div key={user._id}>
                      <div
                        onClick={() => handleUserClick(user)}
                        className={`flex gap-3 
                                                items-center rounded 
                                                p-2 py-1 cursor-pointer
                                                ${
                                                  selectedUserId === user?._id
                                                    ? "bg-sky-500"
                                                    : ""
                                                } `}
                      >
                        {/*Socket is Online*/}
                        <div
                          className={`avatar ${
                            isOnline[index] ? "online" : ""
                          }`}
                        >
                          <div className="w-12 rounded-full">
                            <img src={user.profilePic} alt="user.img" />
                          </div>
                        </div>
                        <div className="flex flex-col flex-1">
                          <p className="font-bold text-gray-950">
                            {user.username}
                          </p>
                        </div>
                        <div>
                          {newMessageUsers.receiverId === authUser._id &&
                          newMessageUsers.senderId === user._id ? (
                            <div className="rounded-full bg-green-700 text-sm text-white px-[4px]">
                              +1
                            </div>
                          ) : (
                            <></>
                          )}
                        </div>
                      </div>
                      <div className="divider divide-solid px-3 h-[1px]"></div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
          <div className="mt-auto px-1 py-1 flex">
            <button
              onClick={handleLogOut}
              className="hover:bg-red-600  w-10 cursor-pointer hover:text-white rounded-lg"
            >
              <BiLogOut size={25} />
            </button>
            <p className="text-sm py-1">Logout</p>
          </div>
        </>
      )}
    </div>
  );
}

export default Sidebar;
