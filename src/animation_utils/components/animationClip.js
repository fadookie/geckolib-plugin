import {animators, duration, getLerpedSkeleton} from '../animationData';
import {LGraphNode} from "litegraph.js";

const STATE_PLAYING = "playing";
const STATE_PAUSED = "paused";
const STATE_STOPPED = "stopped";

class AnimationClip extends LGraphNode {
    constructor() {
        super();
        this.addOutput("", "skeleton");
        this.addProperty("CLIP", Animator.animations[0].name, "enum", {values: Animator.animations.map(x => x.name)});
        this.addProperty("loop", true);
        this.clipWidget = this.addWidget("combo", "Clip", this.properties.CLIP, "CLIP", {values: Animator.animations.map(x => x.name)});
        this.loopWidget = this.addWidget("toggle", "loop", this.properties.loop, "loop");
        // Using an ivar instead of a LGraphNode property so it doesn't get serialized
        this._playState = STATE_PAUSED;
        this.playingWidget = this.addWidget("string", "playing", this._playState);
        this.addProperty("speed", 1);
        this.widget = this.addWidget("slider", "speed", this.properties.speed, this.setProperty.bind(this, 'speed'), {
            min: 0,
            max: 10,
            property: "speed"
        });
        this._seekTime = 0;
        this._refs = new Set();
        this.refCountWidget = this.addWidget("number", "refCount", this._refs.size);
        this.size = [350, 200];
    }
}

AnimationClip.title = "Animation Clip";
AnimationClip.desc = "Animation Clip";
AnimationClip.values = ["animator1", "animator2"];

AnimationClip.prototype.setValue = function (v) {
    this.setProperty("loop", v);
}

///#region LGraphNode Callbacks

AnimationClip.prototype.onAction = function (action) {
    console.log('@@@ onAction:', action);
}

AnimationClip["@CLIP"] = {
    type: "enum",
    title: "clip",
    values: AnimationClip.values
};

AnimationClip.prototype.onExecute = function () {
    // console.log(`@@@ onExectue ${this.name} refs:`, this._refs);
    const loop = this.properties.loop;

    // Calculate current normalized playback seek time (may be > 1)
    switch (this._playState) {
        case STATE_PLAYING: {
            this._seekTime += this.graph.elapsed_time * this.properties.speed;
            break;
        }
        case STATE_STOPPED:
        case STATE_PAUSED: {
            break;
        }
        default: {
            throw new Error(`Unrecognized state: ${this._playState}`);
        }
    }

    // Cull processing for un-retained nodes
    if (this._refs.size > 0 || !this._skeleton) {
        let seekTimeNorm = this._seekTime / duration;
        // Clamp/wrap if needed
        if (seekTimeNorm > 1) {
            if (loop) {
                seekTimeNorm = seekTimeNorm % 1;
            } else {
                this.setPlayState(STATE_STOPPED);
                seekTimeNorm = 1;
            }
        }

        this._skeleton = getLerpedSkeleton(animators[this.properties.CLIP], seekTimeNorm, this.title);
    }
    this.setOutputData(0, this._skeleton);

    if (!this.isOutputConnected(0)) {
        this.setCulled(true);
    }
};

AnimationClip.prototype.onConnectionsChange = function (
    connection,
    slot,
    connected,
    link_inf
) {
    console.log('@@@onOutputRemoved slot:', slot);
    if (this.isOutputConnected(0)) {
        if (this._playState === STATE_PAUSED) this.play();
    } else {
        this.setCulled(true);
    }
}

AnimationClip.prototype.onDrawBackground = function (ctx) {
    //show the current value
    this.outputs[0].label = this.properties.CLIP;
};

AnimationClip.prototype.onPropertyChanged = function (name, value) {
    const widget = this.widgets.find(w => w.options.property == name);
    if (widget) widget.value = value;
    if (name === "loop" && !!value && this._playState === STATE_STOPPED) this.setPlayState(STATE_PLAYING);
    this.setDirtyCanvas(true, true);
};

//#endregion LGraphNode Callbacks

AnimationClip.prototype.setPlayState = function (newState) {
    if (newState === this._playState) return;

    if (this.title === 'Animation Clip 2')
        console.log('@@@ setPlayState unique:', newState);

    if (newState === STATE_PLAYING && this._playState !== STATE_PAUSED) this._startTimeS = this.graph.globaltime;
    this._playState = newState;
    this.playingWidget.value = newState;
}

AnimationClip.prototype.pause = function (ctx) {
    // if (this.title === 'Animation Clip 2')
    //   console.log('@@@PAUSE');

    this.setPlayState(STATE_PAUSED);
}

AnimationClip.prototype.play = function (ctx) {
    // if (this.title === 'Animation Clip 2')
    //   console.log('@@@PLAY');

    this.setPlayState(STATE_PLAYING);
}

AnimationClip.prototype.resume = function (ctx) {
    if (this._playState === STATE_STOPPED) return;
    this.setPlayState(STATE_PLAYING);
}

AnimationClip.prototype.retain = function (retainer) {
    if (!this._refs.has(retainer))
        console.log(`@@@ ${this.title} retain retainer:`, retainer.title, `refs:`, this._refs);
    this._refs.add(retainer);
    this.refCountWidget.value = this._refs.size;
}

AnimationClip.prototype.release = function (retainer) {
    this._refs.delete(retainer);
    this.refCountWidget.value = this._refs.size;
    if (this._refs.has(retainer))
        console.log(`@@@ ${this.title} release retainer:`, retainer.title, `refs:`, this._refs);
}

// AnimationClip.prototype.setValue = function(v) {
//   this.setProperty("value",v);
// };

export default AnimationClip;