import './App.css';
import GBLViewer from "./GBLViewer";
import React, {useState} from "react";

function App() {

    const [model, setModel] = useState('mitsubishi');

    return (
        <React.Fragment>
            <div style={{position: "absolute", top: 0, left: 0}}>
                <div className="btn" onClick={() => setModel(`engine`)}>engine</div>
                <div className="btn" onClick={() => setModel(`mitsubishi`)}>mitsubishi</div>
                <div className="btn" onClick={() => setModel(`Подставка`)}>Подставка</div>
            </div>
            <GBLViewer
                gblFile={`/${model}.glb`}
                textureEnvironment={require("./img/env.jpg")}
                textureBackground={require("./img/bg.jpg")}
            />
        </React.Fragment>
    );
}

export default App;
