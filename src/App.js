import './App.css';
import GBLViewer from "./GBLViewer";

function App() {
    return (
        <GBLViewer
            gblFile="/example.glb"
            textureEnvironment={require("./img/env.jpg")}
            textureBackground={require("./img/bg.jpg")}
        />
    );
}

export default App;
