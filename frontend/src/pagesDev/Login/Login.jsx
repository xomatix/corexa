import React from "react";

function Login() {
  return (
    <div>
      <input type="text" id="sessionId" />
      <button
        onClick={() => {
          sessionStorage.setItem(
            "sessionId",
            document.getElementById("sessionId").value
          );
          window.location.href = "/";
        }}
      >
        Set session id
      </button>
    </div>
  );
}

export default Login;
