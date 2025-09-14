import "./App.css";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

import CollectionPage from "./pagesDev/Collection/CollectionPage";
import CollectionList from "./pagesDev/Collection/CollectionList";
import FlowBuilder from "./pagesDev/FlowBuilder/FlowBuilder";
import FormBuilder from "./pagesDev/FormBuilder/FormBuilder";

function App() {
  return (
    <>
      <nav>
        <Link to={"/"}>Home</Link>
        <Link to={"/collections"}>Collections</Link>
        <Link to={"/collections/insert"}>Collection Add</Link>
        <Link to={"/flowbuilder"}>Flow Builder</Link>
        <Link to={"/formbuilder"}>Form Builder</Link>
      </nav>
      <Routes>
        <Route path="/collections" element={<CollectionList />} />
        <Route path="/collections/:id" element={<CollectionPage />} />
        <Route path="/flowbuilder" element={<FlowBuilder />} />
        <Route path="/formbuilder" element={<FormBuilder />} />
      </Routes>
    </>
  );
}

export default App;
