import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {

    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    const fetchUser = async () => {
        setUser(dummyUserData);
    };

    const fetchUsersChats = async () => {
        setChats(dummyChats);
        setSelectedChat(dummyChats[0]);
    };

    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        if (user) {
            fetchUsersChats();
        } else {
            setChats([]);
            setSelectedChat(null);
        }
    }, [user]);

    const value = {
        navigate, user, setUser, fetchUser, chats, setChats, selectedChat, setSelectedChat, theme, setTheme
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);