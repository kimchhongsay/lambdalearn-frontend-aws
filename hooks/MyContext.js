import React, { createContext, useState, useCallback } from "react";
import { removeHtmlTags } from "../utils/removeHtmlTags";

const MyContext = createContext({
  activeTopTab: "Home",
  setActiveTopTab: () => {},
  refreshKey: 0,
  incrementRefreshKey: () => {},
  userEmail: "",
  setUserEmail: () => {},
  removeHtmlTags,
});

const MyProvider = ({ children }) => {
  const [activeTopTab, setActiveTopTab] = useState("Home");
  const [refreshKey, setRefreshKey] = useState(0);
  const [userEmail, setUserEmail] = useState("");

  const incrementRefreshKey = useCallback(() => {
    setRefreshKey((prevKey) => prevKey + 1);
  }, []);

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
      }}>
      {children}
    </MyContext.Provider>
  );
};

export default MyProvider;
export { MyContext };
