import "./App.css";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, Route, Router, Routes } from "react-router-dom";

import CollectionPage from "./pagesDev/Collection/CollectionPage";
import CollectionList from "./pagesDev/Collection/CollectionList";
import FlowBuilder from "./pagesDev/FlowBuilder/FlowBuilder";
import FormBuilder from "./pagesDev/FormBuilder/FormBuilder";
import PermissionsList from "./pagesDev/Permissions/PermissionsList";
import RolesList from "./pagesDev/Roles/RolesList";
import Login from "./pagesDev/Login/Login";
import UsersList from "./pagesDev/Users/UsersList";
import CTable from "./components/CTable/Ctable";

function App() {
  const isLoggedIn =
    sessionStorage.getItem("sessionId") != null &&
    sessionStorage.getItem("sessionId").length > 0;

  return (
    <>
      <nav>
        <Link to={"/"}>Home</Link>
        <Link to={"/login"}>Login</Link>
        {isLoggedIn && (
          <>
            <a
              onClick={() => {
                sessionStorage.clear();
                window.location.href = "/";
              }}
            >
              Logout
            </a>
            <Link to={"/collections"}>Collections</Link>
            {/* <Link to={"/collections/insert"}>Collection Add</Link> */}
            <Link to={"/permissions"}>Permissions</Link>
            <Link to={"/roles"}>Roles</Link>
            <Link to={"/users"}>Users</Link>
            {/* <Link to={"/flowbuilder"}>Flow Builder</Link>
            <Link to={"/formbuilder"}>Form Builder</Link> */}
          </>
        )}
      </nav>

      <Routes>
        <Route path="/test" element={<CTable collection={"p_workout"} />} />
        <Route path="/collections" element={<CollectionList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/collections/:id" element={<CollectionPage />} />
        <Route path="/permissions" element={<PermissionsList />} />
        <Route path="/roles" element={<RolesList />} />
        <Route path="/users" element={<UsersList />} />
        <Route path="/flowbuilder" element={<FlowBuilder />} />
        <Route path="/formbuilder" element={<FormBuilder />} />
      </Routes>
    </>
  );
}

export default App;
