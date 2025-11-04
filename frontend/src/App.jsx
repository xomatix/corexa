import "./App.css";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Link,
  Route,
  Router,
  Routes,
  useNavigate,
} from "react-router-dom";

import CollectionPage from "./pagesDev/Collection/CollectionPage";
import CollectionList from "./pagesDev/Collection/CollectionList";
import FlowBuilder from "./pagesDev/FlowBuilder/FlowBuilder";
import FormBuilder from "./pagesDev/FormBuilder/FormBuilder";
import PermissionsList from "./pagesDev/Permissions/PermissionsList";
import RolesList from "./pagesDev/Roles/RolesList";
import Login from "./pagesDev/Login/Login";
import UsersList from "./pagesDev/Users/UsersList";
import CTable from "./components/CTable/Ctable";
import { getSessionToken, setSessionToken } from "./service/service";

function App() {
  const isLoggedIn = getSessionToken() != null && getSessionToken().length > 0;

  const navigate = useNavigate();

  const handleLogout = () => {
    setSessionToken("");

    navigate("/");
    window.location.reload();
  };

  return (
    <>
      <nav>
        <Link to={"/"}>Home</Link>
        {!isLoggedIn && <Link to={"/login"}>Login</Link>}
        {isLoggedIn && (
          <>
            <a onClick={() => handleLogout()} style={{ cursor: "pointer" }}>
              Logout
            </a>
            <Link to={"/collections"}>Collections</Link>
            <Link to={"/permissions"}>Permissions</Link>
            <Link to={"/roles"}>Roles</Link>
            <Link to={"/users"}>Users</Link>
          </>
        )}
      </nav>

      <Routes>
        <Route path="/login" element={<Login />} />
        {isLoggedIn ? (
          <>
            <Route path="/collections" element={<CollectionList />} />
            <Route path="/collections/:id" element={<CollectionPage />} />
            <Route path="/permissions" element={<PermissionsList />} />
            <Route path="/roles" element={<RolesList />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/flowbuilder" element={<FlowBuilder />} />
            <Route path="/formbuilder" element={<FormBuilder />} />
          </>
        ) : (
          // Optional: Redirect to login if not authenticated
          <Route path="/*" element={<Login />} />
        )}
      </Routes>
    </>
  );
}

export default App;
