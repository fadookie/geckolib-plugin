import {LGraph, LGraphCanvas, LiteGraph} from "litegraph.js";
import AnimationClip from "./components/animationClip";
import AnimationBlend2 from "./components/AnimationBlend2";

export let canvas;
export let graph;
export let position;

export function startGraph() {
    console.log("canvas", canvas)
    graph = new LGraph();

    canvas = new LGraphCanvas("#editor", graph);
    canvas.renderInfo = () => {
    };
    canvas.prompt = () => {};
    canvas.allow_searchbox = false;
    graph.start()
    LiteGraph.registerNodeType("geckolib/AnimationClip", AnimationClip);
    LiteGraph.registerNodeType("geckolib/Blend2", AnimationBlend2);

    var node_const = LiteGraph.createNode("graph/output");
    node_const.pos = [200,200];
    graph.add(node_const);

    $("#editor").on("contextmenu", (event) => {
        stateMenu.show(event)
        position = [event.offsetX, event.offsetY]
    })

    $("#editor").on("click", (event) => {
        stateMenu.hide()
        position = [event.offsetX, event.offsetY]
    })
    console.log("added listeners")
    canvas.getCanvasWindow().addEventListener("keydown", event => {
        console.log(event);
        canvas._key_callback(event)
    }, true)
}

export function registerStatePanel() {
    return `<div id="statemachineeditor">
    <canvas id='editor' width='1024' height='720' style='border: 1px solid'></canvas>
</div>
    `
}

const stateMenu = new Menu([
    'create_state_node',
    'create_transition_node'
]);