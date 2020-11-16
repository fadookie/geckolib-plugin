import {LGraph, LGraphCanvas, LiteGraph} from "litegraph.js";

(function(){
    var graph = new LGraph();

    var canvas = new LGraphCanvas("#editor", graph);

    var node_const = LiteGraph.createNode("basic/const");
    node_const.pos = [200,200];
    graph.add(node_const);
    node_const.setValue(4.5);

    var node_watch = LiteGraph.createNode("basic/watch");
    node_watch.pos = [700,200];
    graph.add(node_watch);

    node_const.connect(0, node_watch, 0 );

    graph.start()

})();

export function registerStatePanel() {
    return `<div id="statemachineeditor">
    <canvas id='editor' width='1024' height='720' style='border: 1px solid'></canvas>
</div>
    `
}