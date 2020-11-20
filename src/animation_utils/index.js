import semverCoerce from 'semver/functions/coerce';
import semverSatisfies from 'semver/functions/satisfies';
import {blockbenchConfig, version} from './package.json';
import {loadAnimationUI, unloadAnimationUI} from './animationUi';
import {removeMonkeypatches} from './utils';
import {loadKeyframeOverrides, unloadKeyframeOverrides} from './keyframe';
import {canvas, graph, position, registerStatePanel, startGraph} from './state_machine'
import geckoSettings, {OBJ_TYPE_BLOCK_ITEM, OBJ_TYPE_OPTIONS, onSettingsChanged} from './settings';
import codec, {loadCodec, maybeExportItemJson, unloadCodec} from './codec';
import {LiteGraph} from "litegraph.js";

const SUPPORTED_BB_VERSION_RANGE = `${blockbenchConfig.min_version} - ${blockbenchConfig.max_version}`;
if (!semverSatisfies(semverCoerce(Blockbench.version), SUPPORTED_BB_VERSION_RANGE)) {
    alert(`GeckoLib Animation Utils currently only supports Blockbench ${SUPPORTED_BB_VERSION_RANGE}. Please ensure you are using this version of Blockbench to avoid bugs and undefined behavior.`);
}

(function () {
    let createStateAction;
    let createTransitionAction;
    let exportAction;
    let exportDisplayAction;
    let button;

    Plugin.register("animation_utils", Object.assign(
        {},
        blockbenchConfig,
        {
            name: blockbenchConfig.title,
            version,
            onload() {
                loadCodec();
                loadAnimationUI();
                loadKeyframeOverrides();
                registerStatePanel();
                Interface.Panels.animations.condition = {modes: ['animate', 'state_machine']};
                if (!('state_machine_properties' in Interface.Panels)) {
                    Interface.data.right_bar.push('state_machine_properties');
                    Interface.Panels.state_machine_properties = new Panel({
                        id: 'state_machine_properties',
                        icon: 'fas.fa-stream',
                        condition: {modes: ['state_machine']},
                        growable: true,
                        name: "State Machine Properties",
                        toolbars: {},
                        component: {
                            name: 'panel-placeholders',
                            data() {
                                return {
                                    text: ''
                                }
                            },
                            template: `
                        <div style="flex-grow: 1; display: flex; flex-direction: column;">
                            <p>{{ tl('panel.variable_placeholders.info') }}</p>
                            <vue-prism-editor
                                id="var_placeholder_area"
                                class="molang_input dark_bordered tab_target"
                                v-model="text"
                                language="molang"
                                :line-numbers="false"
                                style="flex-grow: 1;"
                                onkeyup="Animator.preview()"
                            />
                        </div>
		                `
                        }
                    });
                }

                if (!$("#statemachineeditor").length) {
                    $("#timeline").prepend(registerStatePanel())
                    startGraph();
                }
                $("#statemachineeditor").hide()
                console.log("Loaded Geckolib")
                BARS.defineActions(new Mode({
                    id: 'state_machine',
                    name: 'State Machine',
                    default_tool: 'move_tool',
                    category: 'navigate',
                    center_windows: ['preview', 'timeline'],
                    keybind: new Keybind({key: 54}),
                    condition: () => Format.animation_mode,
                    onSelect: () => {
                        Interface.data.timeline_height = 600;
                        $("#timeline_vue").hide()
                        $("#statemachineeditor").show()
                        Animator.join()
                    },
                    onUnselect: () => {
                        Interface.data.timeline_height = 250;
                        $("#timeline_vue").show()
                        $("#statemachineeditor").hide()
                        Animator.leave()
                    }
                }))
                Modes.vue.$forceUpdate();
                exportAction = new Action({
                    id: "export_geckolib_model",
                    name: "Export GeckoLib Model",
                    icon: "archive",
                    description:
                        "Export your java animated model as a model for GeckoLib.",
                    category: "file",
                    condition: () => Format.id === "animated_entity_model",
                    click: function () {
                        codec.export();
                    },
                });
                createStateAction = new Action({
                    id: "create_state_node",
                    name: "Create Animation Node",
                    icon: "archive",
                    description:
                        "Create an animation node",
                    condition: () => Modes.selected.id === "state_machine",
                    click: function () {
                        let node_const = LiteGraph.createNode("animation/state");
                        node_const.pos = position;
                        graph.add(node_const);
                        console.log("node")
                    },
                });
                createTransitionAction = new Action({
                    id: "create_transition_node",
                    name: "Create Transition Node",
                    icon: "archive",
                    description:
                        "Create an transition node",
                    condition: () => Modes.selected.id === "state_machine",
                    click: function () {
                        //codec.export();
                    },
                });
                MenuBar.addAction(exportAction, "file.export");

                exportDisplayAction = new Action({
                    id: "export_geckolib_display",
                    name: "Export GeckoLib Display Settings",
                    icon: "icon-bb_interface",
                    description:
                        "Export your java animated model display settings for GeckoLib.",
                    category: "file",
                    condition: () => Format.id === "animated_entity_model" && geckoSettings.objectType === OBJ_TYPE_BLOCK_ITEM,
                    click: maybeExportItemJson,
                });
                MenuBar.addAction(exportDisplayAction, "file.export");

                button = new Action('gecko_settings', {
                    name: 'GeckoLib Model Settings...',
                    description: 'Configure animated model.',
                    icon: 'info',
                    condition: () => Format.id === "animated_entity_model",
                    click: function () {
                        var dialog = new Dialog({
                            id: 'project',
                            title: 'GeckoLib Model Settings',
                            width: 540,
                            lines: [`<b class="tl"><a href="https://github.com/bernie-g/geckolib">GeckoLib</a> Animation Utils v${version}</b>`],
                            form: {
                                objectType: {
                                    label: 'Object Type',
                                    type: 'select',
                                    default: geckoSettings.objectType,
                                    options: OBJ_TYPE_OPTIONS
                                },
                            },
                            onConfirm: function (formResult) {
                                Object.assign(geckoSettings, formResult);
                                onSettingsChanged();
                                dialog.hide()
                            }
                        })
                        dialog.show()
                    }
                });
                MenuBar.addAction(button, 'file.1');
            },
            onunload() {
                createStateAction.delete();
                createTransitionAction.delete();
                exportAction.delete();
                exportDisplayAction.delete();
                button.delete();
                unloadKeyframeOverrides();
                unloadAnimationUI();
                unloadCodec();
                removeMonkeypatches();
                $("#statemachineeditor").remove();
                canvas.getCanvasWindow().document.removeEventListener("keydown", canvas._key_callback)
                console.clear(); // eslint-disable-line no-console
            },
        }
    ));
})();
