import reactLogo from "./assets/react.svg";
import "./App.css";
import { useState } from "react";
import axios from "axios";

const $axios = axios.create({
  baseURL: "https://api.openbrewerydb.org/v1/",
  maxBodyLength: Infinity,
  timeout: 100000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  withCredentials: true,
});

function App() {
  const [value, setValue] = useState("");

  const getBear = async () => {
    const res = await $axios.get(`breweries/${value}`, {
      headers: { MethodKey: "breweries", IdKey: value },
    });

    console.log("res", res);
  };

  const getBearAll = async () => {
    const res = await $axios.get(`breweries`, {
      headers: { MethodKey: "breweries" },
    });

    console.log("res", res);
  };

  return (
    <div>
      <a href="https://react.dev" target="_blank">
        <img src={reactLogo} className="logo react" alt="React logo" />
      </a>
      <input type="text" onChange={(e) => setValue(e.target.value)} />
      <button onClick={getBear}>клик</button>
      <button onClick={getBearAll}>клик Все</button>
    </div>
  );
}

export default App;
