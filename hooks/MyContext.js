import React, { createContext, useState } from "react";

const MyContext = createContext({
  activeTopTab: "Home",
  setActiveTopTab: () => {},
}); // Set the default value directly

const MyProvider = ({ children }) => {
  const [activeTopTab, setActiveTopTab] = useState("Home");

  return (
    <MyContext.Provider value={{ activeTopTab, setActiveTopTab }}>
      {children}
    </MyContext.Provider>
  );
};

export default MyProvider;
export { MyContext };
