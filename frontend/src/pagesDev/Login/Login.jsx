import React, { useState } from "react";
import CInput from "../../components/CInput/CInput";
import CBtn from "../../components/CBtn/CBtn";
import { login } from "../../service/service";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [loginUsr, setLoginUsr] = useState({});

  const navigate = useNavigate();

  const handleLogin = async () => {
    const res = await login(loginUsr["username"], loginUsr["password"]);
    console.log(res);

    if (res.session_id != undefined) navigate("/");
  };

  return (
    <div className="c-login-page">
      <div className="c-login-form">
        <div className="c-login-info">
          <span className="c-title">Login to your account</span>
          <span>Enter your email below to login to your account</span>
        </div>

        <CInput
          setState={setLoginUsr}
          state={loginUsr}
          path="username"
          label="Username"
        />
        <CInput
          setState={setLoginUsr}
          state={loginUsr}
          type="password"
          path="password"
          label="Password"
        />
        <CBtn onClick={handleLogin}>Sign In</CBtn>
      </div>
    </div>
  );
}

export default Login;
