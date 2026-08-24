import "./style.css";
import { initScene } from "./render/scene";

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("#app container missing from index.html");
}

initScene(app);
