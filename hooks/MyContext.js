import React, { createContext, useState, useCallback } from "react";

const MyContext = createContext({
  activeTopTab: "Home",
  setActiveTopTab: () => {},
  refreshKey: 0,
  incrementRefreshKey: () => {},
});

const MyProvider = ({ children }) => {
  const [activeTopTab, setActiveTopTab] = useState("Home");
  const [refreshKey, setRefreshKey] = useState(0);

  const incrementRefreshKey = useCallback(() => {
    setRefreshKey((prevKey) => prevKey + 1);
  }, []);

  return (
    <MyContext.Provider
      value={{
        activeTopTab,
        setActiveTopTab,
        refreshKey,
        incrementRefreshKey,
      }}>
      {children}
    </MyContext.Provider>
  );
};

export default MyProvider;
export { MyContext };
