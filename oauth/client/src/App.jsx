import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Callback from "./pages/Callback";


export default function App() {

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/callback"
          element={<Callback />}
        />

      </Routes>

    </BrowserRouter>
  );
}