import React, { createContext, useState, useCallback } from "react";

const MyContext = createContext({
  activeTopTab: "Home",
  setActiveTopTab: () => {},
  refreshKey: 0,
  incrementRefreshKey: () => {},
  userEmail: "",
  setUserEmail: () => {},
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
      }}>
      {children}
    </MyContext.Provider>
  );
};

export default MyProvider;
export { MyContext };
