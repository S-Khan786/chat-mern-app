import {create} from "zustand";

const userConversation = create((set)=>({
    selectedConversation: null,
    setSelectedConversation:(selectedConversation)=>set({selectedConversation}),
    messages:[],
    setMessage:(messages)=>set((state)=>({ messages: typeof messages === "function" ? messages(state.messages) : messages }))
}));

export default userConversation;