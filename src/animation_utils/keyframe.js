import { Original, addMonkeypatch, hasArgs } from './utils';
import { easingFunctions, EASING_DEFAULT, getEasingArgDefault } from './easing';

//#region Keyframe Mixins
export function loadKeyframeOverrides() {
  addMonkeypatch(Keyframe, "prototype", "getLerp", keyframeGetLerp);
  addMonkeypatch(Keyframe, "prototype", "getArray", keyframeGetArray);
  addMonkeypatch(Keyframe, "prototype", "getUndoCopy", keyframeGetUndoCopy);
  addMonkeypatch(Keyframe, "prototype", "extend", keyframeExtend);

  addMonkeypatch(BarItems.reverse_keyframes, null, "condition", reverseKeyframesCondition);
}

export function unloadKeyframeOverrides() {
  //No-op for now since monkeypatches are unloaded automatically
}

function lerp(start, stop, amt) {
  return amt * (stop - start) + start;
}

// eslint-disable-next-line no-unused-vars
function keyframeGetLerp(other, axis, amount, allow_expression) {
  const easing = other.easing || EASING_DEFAULT;
  if (Format.id !== "animated_entity_model") {
    return Original.get(Keyframe).getLerp.apply(this, arguments);
  }
  let easingFunc = easingFunctions[easing];
  if (hasArgs(easing)) {
    const arg1 = Array.isArray(other.easingArgs) && other.easingArgs.length > 0
      ? other.easingArgs[0]
      : getEasingArgDefault(other);
    // console.log(`keyframeGetLerp arg1: ${arg1}`);
    easingFunc = easingFunc.bind(null, arg1);
  }
  const easedAmount = easingFunc(amount); 
  const start = this.calc(axis);
  const stop = other.calc(axis);
  const result = lerp(start, stop, easedAmount);
  // console.log('keyframeGetLerp easing:', easing, 'arguments:', arguments, 'start:', start, 'stop:', stop, 'amount:', amount, 'easedAmount:', easedAmount, 'result:', result);
  if (Number.isNaN(result)) {
    throw new Error('batman');
  }
  return result;
}

function keyframeGetArray() {
  const { easing, easingArgs } = this;
  let result = Original.get(Keyframe).getArray.apply(this, arguments);
  if (Format.id === "animated_entity_model") {
    result = { vector: result, easing };
    if (hasArgs(easing)) result.easingArgs = easingArgs;
  }
  return result;
}

function keyframeGetUndoCopy() {
  const { easing, easingArgs } = this;
  const result = Original.get(Keyframe).getUndoCopy.apply(this, arguments);
  if (Format.id === "animated_entity_model") {
    Object.assign(result, { easing });
    if (hasArgs(easing)) result.easingArgs = easingArgs;
  }
  return result;
}

function keyframeExtend(dataIn) {
  const data = Object.assign({}, dataIn);
  if (Format.id === "animated_entity_model") {
    if (typeof data.values === 'object') {
      if (data.values.easing !== undefined) {
        Merge.string(this, data.values, 'easing');
      }
      if (Array.isArray(data.values.easingArgs)) {
        this.easingArgs = data.values.easingArgs;
      }
      if (!Array.isArray(data.values) && Array.isArray(data.values.vector)) {
        // Convert data to format expected by KeyframeExtendOriginal
        data.values = data.values.vector;
      }
    } else {
      if (data.easing !== undefined) {
          Merge.string(this, data, 'easing');
      }
      if (Array.isArray(data.easingArgs)) {
        this.easingArgs = data.easingArgs;
      }
    }
  }
  const result = Original.get(Keyframe).extend.apply(this, arguments);
  return result;
}

function reverseKeyframesCondition() {
  const res = Original.get(BarItems.reverse_keyframes).condition() && Format.id !== "animated_entity_model";
  // console.log('reverseKeyframesCondition original:',Original.get(BarItems.reverse_keyframes).condition(), 'res:', res);
  return res;
}

function loadFile(file, animation_filter) {
  var json = file.json || autoParseJSON(file.content);
  let path = file.path;
  let new_animations = [];
  if (json && typeof json.animations === 'object') {
    for (var ani_name in json.animations) {
      if (animation_filter && !animation_filter.includes(ani_name)) continue;
      //Animation
      var a = json.animations[ani_name]
      var animation = new Animation({
        name: ani_name,
        path,
        loop: a.loop && (a.loop == 'hold_on_last_frame' ? 'hold' : 'loop'),
        override: a.override_previous_animation,
        anim_time_update: (typeof a.anim_time_update == 'string'
            ? a.anim_time_update.replace(/;(?!$)/, ';\n')
            : a.anim_time_update),
        blend_weight: (typeof a.blend_weight == 'string'
            ? a.blend_weight.replace(/;(?!$)/, ';\n')
            : a.blend_weight),
        length: a.animation_length
      }).add()
      //Bones
      if (a.bones) {
        function getKeyframeDataPoints(source) {
          if (source instanceof Array) {
            return [{
              x: source[0],
              y: source[1],
              z: source[2],
            }]
          } else if (['number', 'string'].includes(typeof source)) {
            return [{
              x: source, y: source, z: source
            }]
          } else if (typeof source == 'object') {
            let points = [];
            if (source.pre) {
              points.push(getKeyframeDataPoints(source.pre)[0])
            }
            if (source.post) {
              points.push(getKeyframeDataPoints(source.post)[0])
            }
            return points;
          }
        }
        for (var bone_name in a.bones) {
          var b = a.bones[bone_name]
          let lowercase_bone_name = bone_name.toLowerCase();
          var group = Group.all.find(group => group.name.toLowerCase() == lowercase_bone_name)
          let uuid = group ? group.uuid : guid();

          var ba = new BoneAnimator(uuid, animation, bone_name);
          animation.animators[uuid] = ba;
          //Channels
          for (var channel in b) {
            if (Animator.possible_channels[channel]) {
              if (typeof b[channel] === 'string' || typeof b[channel] === 'number' || b[channel] instanceof Array) {
                ba.addKeyframe({
                  time: 0,
                  channel,
                  data_points: getKeyframeDataPoints(b[channel]),
                })
              } else if (typeof b[channel] === 'object') {
                for (var timestamp in b[channel]) {
                  ba.addKeyframe({
                    time: parseFloat(timestamp),
                    channel,
                    interpolation: b[channel][timestamp].lerp_mode,
                    data_points: getKeyframeDataPoints(b[channel][timestamp]),
                  });
                }
              }
            }
          }
        }
      }
      if (a.sound_effects) {
        if (!animation.animators.effects) {
          animation.animators.effects = new EffectAnimator(animation);
        }
        for (var timestamp in a.sound_effects) {
          var sounds = a.sound_effects[timestamp];
          if (sounds instanceof Array === false) sounds = [sounds];
          animation.animators.effects.addKeyframe({
            channel: 'sound',
            time: parseFloat(timestamp),
            data_points: sounds
          })
        }
      }
      if (a.particle_effects) {
        if (!animation.animators.effects) {
          animation.animators.effects = new EffectAnimator(animation);
        }
        for (var timestamp in a.particle_effects) {
          var particles = a.particle_effects[timestamp];
          if (particles instanceof Array === false) particles = [particles];
          particles.forEach(particle => {
            if (particle) particle.script = particle.pre_effect_script;
          })
          animation.animators.effects.addKeyframe({
            channel: 'particle',
            time: parseFloat(timestamp),
            data_points: particles
          })
        }
      }
      if (a.timeline) {
        if (!animation.animators.effects) {
          animation.animators.effects = new EffectAnimator(animation);
        }
        for (var timestamp in a.timeline) {
          var entry = a.timeline[timestamp];
          var script = entry instanceof Array ? entry.join('\n') : entry;
          animation.animators.effects.addKeyframe({
            channel: 'timeline',
            time: parseFloat(timestamp),
            data_points: [{script}]
          })
        }
      }
      animation.calculateSnappingFromKeyframes();
      if (!Animation.selected && Animator.open) {
        animation.select()
      }
      new_animations.push(animation)
    }
  }
  return new_animations
}



//#endregion Keyframe Mixins