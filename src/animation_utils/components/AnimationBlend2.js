import invoke from 'lodash/invoke';
import {blendSkeletons} from '../animationData';
import {greaterThanOrEquals, lessThanOrEquals} from 'float'

//your node constructor class
function AnimationBlend2() {
    //add some input slots
    this.addInput("In", "skeleton");
    this.addInput("Blend", "skeleton");
    //add some output slots
    this.addOutput("Out", "skeleton");
    //add some properties
    this.addProperty("weight", 0.5);
    this.widget = this.addWidget("slider", "weight", this.properties.weight, v => this.setProperty('weight', v), {
        min: 0,
        max: 1,
        property: "weight"
    });
    // this.widgets_up = true;
    this._isPlaying = false;
}

//name to show on the canvas
AnimationBlend2.title = "Blend 2";

//function to call when the node is executed
AnimationBlend2.prototype.onExecute = function () {
    // console.log(`@@@ AnimationBlend2[${this.title}] onExecute 1`);
    //retrieve data from inputs
    var A = this.getInputData(0);
    if (A === undefined) return;
    var B = this.getInputData(1);
    if (B === undefined) return;
    //assing data to otputs
    this.setOutputData(0, blendSkeletons(A, B, this.properties.weight));

    // Cull graph, pause insignificant nodes
    // TODO make this recursive and generic
    // and maybe it's easier to do this as lookahead instead of lookbehind
    // So multiple children can be taken into account, giving each node a playing state incl. blends
    // Or just keep lookbehind but use reference counting
    const shallowAncestors = this.inputs.map(input =>
        this.graph.getNodeById(this.graph.links[input.link].origin_id));
    if (shallowAncestors[0] === shallowAncestors[1]) return; // someone is blending the same node with itself?

    // There are some precision errors with properties it seems, so use approx math
    if (lessThanOrEquals(this.properties.weight, 0)) {
        if (shallowAncestors[1].release) {
            invoke(shallowAncestors[1], 'release', this); // TODO Should recursively update ancestors
        } else {
            //TODO recur
        }
        invoke(shallowAncestors[0], 'retain', this);
    } else if (greaterThanOrEquals(this.properties.weight, 1)) {
        if (shallowAncestors[0].retain) {
            invoke(shallowAncestors[0], 'release', this); // TODO Should recursively update ancestors
        } else {
            //TODO recur
        }
        invoke(shallowAncestors[1], 'retain', this);
    } else {
        invoke(shallowAncestors[0], 'retain', this);
        invoke(shallowAncestors[1], 'retain', this);
        //TODO recur
    }
}

AnimationBlend2.prototype.onPropertyChanged = function (name, value) {
    const widget = this.widgets.find(w => w.options.property == name);
    if (widget) widget.value = value;
}

export default AnimationBlend2;