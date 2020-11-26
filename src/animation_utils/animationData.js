import pick from 'lodash/pick';
import {Vector} from 'p5';

export const animators = {};
let p5;

const makeKeyframe = (x, y, r = 0) => ({v: p5.createVector(x, y), r});

export const init = p => {
    p5 = p;
    Vector.prototype.toJSON = function () {
        return pick(this, ['x', 'y', 'z']);
    };

    animators.animator1 = {
        bone1: [makeKeyframe(120, 20), makeKeyframe(120, 60, 45), makeKeyframe(120, 20)],
        bone2: [makeKeyframe(40, 40, 0), makeKeyframe(120, 120, 90), makeKeyframe(40, 40, 0)],
        bone3: [makeKeyframe(40, 40), makeKeyframe(120, 120), makeKeyframe(40, 40)],
    };

    animators.animator2 = {
        bone1: [makeKeyframe(120, 20), makeKeyframe(200, 20, 45), makeKeyframe(120, 20)],
        bone2: [makeKeyframe(40, 40, 0), makeKeyframe(40, 40, -45), makeKeyframe(40, 40, 0)],
        bone3: [makeKeyframe(40, 40), makeKeyframe(40, 40), makeKeyframe(40, 40)]
    };

};

export const duration = 3;

export const lerpKeyframe = (a, b, t) => {
    if (!a && b) {
        return b;
    }
    if (a && !b) {
        return a;
    }
    if (!a && !b) {
        return false;
    }
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function lerp(start, stop, amt) {
    return amt * (stop - start) + start;
}

// let lastAnim2FromIndex = null;

export const getLerpedSkeleton = (animation, t, debugTitle) => {
    Timeline.time = t * animation.length;
    console.log(Timeline.time)
    return Group.all.map(group => {
        return {
            "group": animation.getBoneAnimator(group),
            "scale": animation.getBoneAnimator(group).interpolate('scale'),
            "rotation": animation.getBoneAnimator(group).interpolate('rotation'),
            "position": animation.getBoneAnimator(group).interpolate('position'),
        }
    });
};

// TODO: blend to buffer
export const blendSkeletons = (a, b, weight) => {
    let blendedBones = a.map(x => {
        let matching = b.find(y => y.group.uuid == x.group.uuid);
        if (matching) {
            return {
                "group": x.group,
                "scale": lerpKeyframe(x.scale, matching.scale, weight),
                "rotation": lerpKeyframe(x.rotation, matching.rotation, weight),
                "position": lerpKeyframe(x.position, matching.position, weight)
            }
        }
        return x;
    });

    b.forEach(x => {
        let matching = a.find(y => y.group.uuid == x.group.uuid);
        if (!matching || !blendedBones.some(bone => bone.group.uuid == matching.group.uuid)) {
            blendedBones.push(matching);
        }
    })
    return blendedBones;
};
