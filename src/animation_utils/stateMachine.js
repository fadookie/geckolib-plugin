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
    canvas.prompt = () => {
    };
    canvas.allow_searchbox = false;
    graph.start()
    LiteGraph.registerNodeType("geckolib/AnimationClip", AnimationClip);
    LiteGraph.registerNodeType("geckolib/Blend2", AnimationBlend2);

    var output = LiteGraph.createNode("graph/output");
    output.pos = [200, 200];
    output.onExecute = function () {
        if (Modes.selected.id !== "state_machine") {
            return;
        }
        let inputData = this.getInputData(0, false);
        Animator.showDefaultPose(true);
        if (inputData) {
            inputData.forEach(x => {
                displayFrame(x);
            })
        }
    }
    graph.add(output);

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
        if (Modes.selected.id == "state_machine") {
            canvas._key_callback(event)
        }
    }, true)
}

export function registerStatePanel() {
    return `<div id="statemachineeditor">
    <canvas id='editor' width='1024' height='720' style='border: 1px solid'></canvas>
</div>
    `
}

function displayFrame(group, multiplier = 1) {
    if (!group.group.doRender()) return;
    group.group.getGroup()
    console.log(group.position)
    if (!group.group.muted.rotation) group.group.displayRotation(group.rotation, multiplier)
    if (!group.group.muted.position) group.group.displayPosition(group.position, multiplier)
    if (!group.group.muted.scale) group.group.displayScale(group.scale, multiplier)
}

const stateMenu = new Menu([
    'create_state_node',
    'create_blend_node'
]);