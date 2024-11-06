import { useEffect } from 'react';
import './App.css';
import { InitThree } from './utils';

let model: InitThree;
let init = true;
function App() {
  useEffect(() => {
    if (init) {
      init = false;
      return;
    }
    model = new InitThree({
      id: 'scene',
    });
    model.init();
    model.load('panda.glb');
    console.log(model);

    return () => {
      model?.unload();
    };
  }, []);

  return (
    <>
      <div className="root">
        <div className="scene" id="scene"></div>
      </div>
    </>
  );
}

export default App;
