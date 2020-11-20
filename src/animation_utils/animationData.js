import pick from 'lodash/pick';
import { Vector } from 'p5';

export const animators = {};
let p5;

const makeKeyframe = (x, y, r = 0) => ({ v: p5.createVector(x, y), r });

export const init = p => {
  p5 = p;
  Vector.prototype.toJSON = function() {
    return pick(this, ['x', 'y', 'z']);
  };

  animators.animator1 = { 
    bone1: [makeKeyframe(120, 20),    makeKeyframe(120, 60, 45),    makeKeyframe(120, 20)],
    bone2: [makeKeyframe(40, 40, 0),  makeKeyframe(120, 120, 90),   makeKeyframe(40, 40, 0)],
    bone3: [makeKeyframe(40, 40),     makeKeyframe(120, 120),       makeKeyframe(40, 40)],
  };
  
  animators.animator2 = { 
    bone1: [makeKeyframe(120, 20),    makeKeyframe(200, 20, 45),    makeKeyframe(120, 20)],
    bone2: [makeKeyframe(40, 40, 0),  makeKeyframe(40, 40, -45),    makeKeyframe(40, 40, 0)],
    bone3: [makeKeyframe(40, 40),     makeKeyframe(40, 40),         makeKeyframe(40, 40)]
  };
  
};

export const duration = 3;

export const lerpKeyframe = (a, b, t) => {
  const vec = Vector.lerp(a.v, b.v, t);
  return makeKeyframe(vec.x, vec.y, p5.lerp(a.r, b.r, t));
}

// let lastAnim2FromIndex = null;

export const getLerpedSkeleton = (animator, t, debugTitle) => {
  const numFrames = animator.bone1.length;
  const frameLength = duration / numFrames;
  const timeS = t * (numFrames - 1);
  const fromIndex = Math.floor(timeS);
  const fromIndexFloor = Math.min(fromIndex, numFrames - 1);
  const toIndex = (fromIndexFloor + 1)  % numFrames;
  const timeIntoFrameS = timeS - (fromIndex * frameLength)
  const timeIntoFrameNorm = timeIntoFrameS / frameLength;
  const res = {
    bone1: lerpKeyframe(animator.bone1[fromIndexFloor], animator.bone1[toIndex], timeIntoFrameNorm),
    bone2: lerpKeyframe(animator.bone2[fromIndexFloor], animator.bone2[toIndex], timeIntoFrameNorm),
    bone3: lerpKeyframe(animator.bone3[fromIndexFloor], animator.bone3[toIndex], timeIntoFrameNorm),    
  };
  // if (debugTitle === 'Animation Clip 2')  {
  //   console.log('@@@ getLerpedSkeleton', { t, timeIntoFrameNorm, lastAnim2FromIndex, fromIndex, toIndex }, 'res:', res);
  // }
  return res;
};

// TODO: blend to buffer
export const blendSkeletons = (a, b, weight) => ({
  bone1: lerpKeyframe(a.bone1, b.bone1, weight),
  bone2: lerpKeyframe(a.bone2, b.bone2, weight),
  bone3: lerpKeyframe(a.bone3, b.bone3, weight),    
});
