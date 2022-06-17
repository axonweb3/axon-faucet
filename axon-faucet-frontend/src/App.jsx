import "./App.scss";

import React, { useEffect } from "react";
import Axios from "axios";

import { BrowserRouter } from "react-router-dom";

import Routes from "./Routes";
import { RequesterContext } from "./utils";

export default function App() {
  useEffect(() => {
    function appHeight() {
      const doc = document.documentElement;
      doc.style.setProperty("--app-height", `${window.innerHeight}px`);
    }
    window.addEventListener("resize", appHeight);
    appHeight();
    return () => {
      window.removeEventListener("resize", appHeight);
    };
  }, []);

  return (
  // eslint-disable-next-line max-len
    <RequesterContext.Provider value={Axios.create({ baseURL: process.env.REACT_APP_BACKEND_PPOINT })}>
      <BrowserRouter>
        <div className="App d-flex flex-column">
          <Routes />
        </div>
      </BrowserRouter>
    </RequesterContext.Provider>
  );
}
