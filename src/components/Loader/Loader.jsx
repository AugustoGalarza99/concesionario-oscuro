import React from "react";
import "./Loader.css";

const Loader = ({ size = "medium", message = "Cargando..." }) => {
  return (
    <div className={`loader-container loader-${size}`}>
      <div className="loader">
        <div className="loader-ring"></div>
        <div className="loader-ring"></div>
        <div className="loader-ring"></div>
        <div className="loader-core"></div>
        <div className="loader-text">{message}</div>
      </div>
    </div>
  );
};

export default Loader;