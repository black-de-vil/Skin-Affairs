import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Point axios at the backend. VITE_API_URL comes from the client .env — set
// it to the hosted backend URL when the API runs on a separate service. When
// it's empty, requests stay relative and the Vite dev proxy (/api -> :3000)
// is used.
const API_URL = import.meta.env.VITE_API_URL;
if (API_URL) {
    axios.defaults.baseURL = API_URL;
}

// Without a timeout, a server that accepts the connection but never answers
// leaves every request pending forever — which showed up as the app being
// stuck on its loading spinner with nothing to retry and no error to show.
// AI replies are slow by nature, so the message endpoint overrides this.
axios.defaults.timeout = 20000;
const MESSAGE_TIMEOUT = 120000;

// Turns an axios/network failure into something worth showing a user.
const TIMEOUT_CODES = ['ECONNABORTED', 'ETIMEDOUT'];

const toMessage = (error, fallback) => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.code === 'ERR_NETWORK') return "Can't reach the server. Check your connection and try again.";
    if (TIMEOUT_CODES.includes(error?.code)) return 'The server took too long to respond. Please try again.';
    return error?.message || fallback;
};

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {

    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const [loading, setLoading] = useState(true);

    const setAuthHeader = (token) => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = token;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    };

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setAuthHeader(null);
        setUser(null);
        setChats([]);
        setSelectedChat(null);
    }, []);

    // An expired token used to leave the app in a half-broken state where
    // every request failed but the UI still looked signed in. Drop straight
    // back to the login screen instead.
    useEffect(() => {
        const id = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error?.response?.status === 401 && localStorage.getItem('token')) {
                    logout();
                }
                return Promise.reject(error);
            }
        );
        return () => axios.interceptors.response.eject(id);
    }, [logout]);

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
                const list = data.chats || [];
                setChats(list);
                setSelectedChat((prev) => {
                    if (!prev) return prev;
                    const fresh = list.find((c) => String(c._id) === String(prev._id));
                    // Keep the existing object when nothing changed so React
                    // doesn't re-render the whole message list for nothing.
                    if (!fresh) return prev;
                    if (fresh.messages?.length === prev.messages?.length && fresh.updatedAt === prev.updatedAt) {
                        return prev;
                    }
                    return fresh;
                });
                return list;
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
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.style.colorScheme = theme;
        localStorage.setItem('theme', theme);
    }, [theme]);

    const register = async (name, email, password) => {
        try {
            const { data } = await axios.post('/api/user/register', { name, email, password });
            if (!data.success) {
                throw new Error(data.message || 'Registration failed');
            }
            localStorage.setItem('token', data.token);
            setAuthHeader(data.token);
            await fetchUser();
            await fetchUsersChats();
            return data;
        } catch (error) {
            throw new Error(toMessage(error, 'Registration failed'), { cause: error });
        }
    };

    const login = async (email, password) => {
        try {
            const { data } = await axios.post('/api/user/login', { email, password });
            if (!data.success) {
                throw new Error(data.message || 'Login failed');
            }
            localStorage.setItem('token', data.token);
            setAuthHeader(data.token);
            await fetchUser();
            await fetchUsersChats();
            return data;
        } catch (error) {
            throw new Error(toMessage(error, 'Login failed'), { cause: error });
        }
    };

    const newChat = useCallback(() => {
        setSelectedChat(null);
        navigate('/');
    }, [navigate]);

    const deleteChat = useCallback(async (chatId) => {
        try {
            const { data } = await axios.post('/api/chat/delete', { chatId });
            if (data && data.success === false) return;
        } catch {
            // Leave the chat in place rather than showing it as deleted when
            // the server never actually deleted it.
            return;
        }
        setChats((prev) => {
            const next = prev.filter((c) => String(c._id) !== String(chatId));
            setSelectedChat((current) =>
                String(current?._id) === String(chatId) ? next[0] || null : current
            );
            return next;
        });
    }, []);

    const ensureChat = async () => {
        if (selectedChat?._id) return selectedChat;
        const { data } = await axios.post('/api/chat/create');
        if (!data.success) throw new Error(data.message || data.error || 'Failed to create chat');
        const chat = data.chat;
        setChats((prev) => [chat, ...prev]);
        setSelectedChat(chat);
        return chat;
    };

    // Sends a chat message. `images` is an optional array of base64 data
    // URLs for skin photos the user attached; it is forwarded in the request
    // body so the backend can store them and analyse them with the AI.
    const sendMessage = useCallback(async (prompt, images) => {
        let data;
        try {
            const chat = await ensureChat();
            ({ data } = await axios.post(
                '/api/message/text',
                {
                    chatId: chat._id,
                    prompt,
                    images: images && images.length ? images : undefined,
                },
                // The AI needs far longer than an ordinary request, and the
                // model fallback chain can add another attempt on top.
                { timeout: MESSAGE_TIMEOUT }
            ));

            if (!data.success) throw new Error(data.message || 'Message failed');

            const replyContent = data.reply?.content || '';
            const userMsg = {
                role: 'user',
                content: prompt,
                // The server returns the hosted URLs it saved the photos to.
                // That list is empty when photo storage isn't configured, so
                // check its length — `[] || images` would quietly drop the
                // user's photos out of their own message.
                image: data.imageUrls?.length ? data.imageUrls : images || [],
                timestamp: Date.now(),
                isImage: false,
            };
            const assistantMsg = {
                role: 'assistant',
                content: replyContent,
                timestamp: data.reply?.timestamp || Date.now(),
                isImage: false,
            };

            const updatedChat = {
                ...chat,
                updatedAt: new Date().toISOString(),
                messages: [...(chat.messages || []), userMsg, assistantMsg],
            };
            setSelectedChat(updatedChat);
            setChats((prev) => [updatedChat, ...prev.filter((c) => String(c._id) !== String(chat._id))]);

            // Reconcile with the server in the background — awaiting these used
            // to add a second round-trip before the reply appeared on screen.
            fetchUsersChats();
            fetchUser();

            return replyContent;
        } catch (error) {
            throw new Error(toMessage(error, 'Message failed'), { cause: error });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChat, fetchUser, fetchUsersChats]);

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
