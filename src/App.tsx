import { useEffect } from 'react';
import './App.css';
import { InitThree } from './utils';
// import { InitThree } from './utils/jump';
import { debounce } from './utils/debounce-throttle';

let model: InitThree;
function App() {
  useEffect(() => {
    debounce(() => {
      model = new InitThree({
        id: 'scene',
      });
      model.init();
      console.log(model);
    });

    return () => {
      // model?.unload();
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
