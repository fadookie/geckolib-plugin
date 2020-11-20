import {LGraph, LGraphCanvas, LiteGraph} from "litegraph.js";

export let canvas;
export let graph;
export let position;

export function startGraph() {
    graph = new LGraph();

    canvas = new LGraphCanvas("#editor", graph);
    canvas.renderInfo = () => {
    };
    canvas.allow_searchbox = false;

    function StateNode() {
        this.addInput("Input", LiteGraph.ACTION);
        this.addOutput("Transition", LiteGraph.EVENT);
        this.serialize_widgets = true;
    }
    StateNode.title = "Animation"

    LiteGraph.registerNodeType("animation/state", StateNode);
    graph.start()

    StateNode.prototype.onConnectInput = function (inputIndex, type, outputSlot) {
        console.log(inputIndex, type, outputSlot)
        return true;
    }
    $("#editor").on("contextmenu", (event) => {
        stateMenu.show(event)
        position = [event.offsetX, event.offsetY]
    })

    $("#editor").on("click", (event) => {
        stateMenu.hide()
        position = [event.offsetX, event.offsetY]
    })
    console.log("added listeners")
    canvas.getCanvasWindow().addEventListener("keydown", canvas._key_callback, true)
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