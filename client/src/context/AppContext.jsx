import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Point axios at the backend. VITE_API_URL comes from src/.env — set it to the
// hosted backend URL when the API runs on a separate service. When it's empty,
// requests stay relative and the Vite dev proxy (/api -> :3000) is used.
const API_URL = import.meta.env.VITE_API_URL;
if (API_URL) {
    axios.defaults.baseURL = API_URL;
}

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {

    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [loading, setLoading] = useState(true);

    const setAuthHeader = (token) => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = token;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    };

    const fetchUser = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/user/data');
            if (data.success) {
                setUser(data.user);
                return data.user;
            }
            setUser(null);
            return null;
        } catch {
            setUser(null);
            return null;
        }
    }, []);

    const fetchUsersChats = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/chat/get');
            if (data.success) {
                setChats(data.chats || []);
                setSelectedChat((prev) => {
                    if (!prev) return prev;
                    const fresh = (data.chats || []).find((c) => String(c._id) === String(prev._id));
                    return fresh || prev;
                });
                return data.chats || [];
            }
            return [];
        } catch {
            return [];
        }
    }, []);

    // Restore session from stored token on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setAuthHeader(token);
            fetchUser().then((u) => {
                if (u) fetchUsersChats();
            }).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [fetchUser, fetchUsersChats]);

    // Keep the auth header in sync whenever we have a user
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (user && token) setAuthHeader(token);
    }, [user]);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const register = async (name, email, password) => {
        const { data } = await axios.post('/api/user/register', { name, email, password });
        if (!data.success) {
            throw new Error(data.message || 'Registration failed');
        }
        localStorage.setItem('token', data.token);
        setAuthHeader(data.token);
        await fetchUser();
        await fetchUsersChats();
        return data;
    };

    const login = async (email, password) => {
        const { data } = await axios.post('/api/user/login', { email, password });
        if (!data.success) {
            throw new Error(data.message || 'Login failed');
        }
        localStorage.setItem('token', data.token);
        setAuthHeader(data.token);
        await fetchUser();
        await fetchUsersChats();
        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setAuthHeader(null);
        setUser(null);
        setChats([]);
        setSelectedChat(null);
    };

    const newChat = () => {
        setSelectedChat(null);
    };

    const deleteChat = async (chatId) => {
        await axios.post('/api/chat/delete', { chatId });
        setChats((prev) => prev.filter((c) => c._id !== chatId));
        if (selectedChat?._id === chatId) {
            setSelectedChat(chats.find((c) => c._id !== chatId) || null);
        }
    };

    const ensureChat = async () => {
        if (selectedChat?._id) return selectedChat;
        const { data } = await axios.post('/api/chat/create');
        if (!data.success) throw new Error(data.message || 'Failed to create chat');
        const chat = data.chat;
        setChats((prev) => [chat, ...prev]);
        setSelectedChat(chat);
        return chat;
    };

    // Sends a chat message. `images` is an optional array of base64 data
    // URLs for skin photos the user attached; it is forwarded in the request
    // body so the backend can store them and analyse them with the AI.
    const sendMessage = async (prompt, images) => {
        const chat = await ensureChat();
        const { data } = await axios.post('/api/message/text', {
            chatId: chat._id,
            prompt,
            images: images && images.length ? images : undefined,
        });
        if (!data.success) throw new Error(data.message || 'Message failed');
        const replyContent = data.reply?.content || '';

        // Deterministically append both messages to context state so the UI
        // updates even before the server refetch below resolves.
        const userMsg = { role: 'user', content: prompt, image: images || [], timestamp: Date.now(), isImage: false };
        const assistantMsg = { role: 'assistant', content: replyContent, timestamp: data.reply?.timestamp || Date.now(), isImage: false };
        const updatedChat = { ...chat, messages: [...(chat.messages || []), userMsg, assistantMsg] };
        setSelectedChat(updatedChat);
        setChats((prev) => [updatedChat, ...prev.filter((c) => String(c._id) !== String(chat._id))]);

        // Reconcile with the server (also refreshes ordering) and update the
        // user's remaining credits shown in the sidebar.
        await fetchUsersChats();
        fetchUser();

        return replyContent;
    };

    const value = {
        navigate,
        loading,
        user,
        setUser,
        fetchUser,
        register,
        login,
        logout,
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        newChat,
        deleteChat,
        sendMessage,
        theme,
        setTheme
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);