import React, { createContext, useState, useCallback } from "react";
import { removeHtmlTags } from "../utils/removeHtmlTags";
import {
  ToastProvider,
  useToast as useToastNotification,
} from "react-native-toast-notifications";

const MyContext = createContext({
  activeTopTab: "Home",
  setActiveTopTab: () => {},
  refreshKey: 0,
  incrementRefreshKey: () => {},
  userEmail: "",
  setUserEmail: () => {},
  removeHtmlTags,
  showToast: () => {},
});

const MyProvider = ({ children }) => {
  const [activeTopTab, setActiveTopTab] = useState("Home");
  const [refreshKey, setRefreshKey] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const toast = useToastNotification();

  const incrementRefreshKey = useCallback(() => {
    setRefreshKey((prevKey) => prevKey + 1);
  }, []);

  const showToast = (message, options) => {
    toast.show(message, options);
  };

  return (
    <MyContext.Provider
      value={{
        activeTopTab,
        setActiveTopTab,
        refreshKey,
        setRefreshKey,
        incrementRefreshKey,
        userEmail,
        setUserEmail,
        removeHtmlTags,
        toast,
        showToast,
      }}>
      {children}
    </MyContext.Provider>
  );
};

export default MyProvider;
export { MyContext };
