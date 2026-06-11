
import "./styles/app.scss"
import ToolBar from "./compose/ToolBar";
import SettingBar from "./compose/SettingBar";
import Canvas from "./compose/Canvas";
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
function App() {
  return (
      <BrowserRouter>
    <div className="app">
      <Routes>
        <Route path='/:id' element={
          <>
            <ToolBar />
            <SettingBar />
            <Canvas />
          </>
        } />
        <Route
            path="/"
            element={<Navigate to={`f${(+new Date()).toString(16)}`} replace />}
        />
      </Routes>
    </div>
      </BrowserRouter>
  );
}

export default App;
