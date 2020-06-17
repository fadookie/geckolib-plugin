(function() {

let button;
let fabricOptions;

const getStorageKey = () => `modded_entity_fabric.${Project.name}`;

function loadFabricOptions() {
	const storageKey = getStorageKey();
	fabricOptions = localStorage.getItem(storageKey)
		? JSON.parse(localStorage.getItem(storageKey))
		: {};
}

const initModelCallback = (tag) => console.log(`mod#tag:${tag}`);

function setTemplate() {
	Codecs.modded_entity.templates['1.15'] = {
		name: '1.15 - Fabric',
		flip_y: true,
		integer_size: false,
		file: 
			 `// Made with Blockbench %(bb_version)
				// Exported for Minecraft version 1.15
				// Paste this class into your mod and generate all required imports
				// Test test test

				${fabricOptions.header}

				public class %(identifier) extends EntityModel<${fabricOptions.entity}> {
						%(fields)
						public %(identifier)() {
								textureWidth = %(texture_width);
								textureHeight = %(texture_height);
								%(content)
						}
						@Override
						public void setAngles(${fabricOptions.entity} entity, float limbSwing, float limbSwingAmount, float ageInTicks, float netHeadYaw, float headPitch){
								//previously the render function, render code was moved to a method below
						}
						@Override
						public void render(MatrixStack matrixStack, VertexConsumer  buffer, int packedLight, int packedOverlay, float red, float green, float blue, float alpha){
								${fabricOptions.render}
								%(renderers)
						}
						public void setRotationAngle(ModelPart bone, float x, float y, float z) {
								bone.pitch = x;
								bone.yaw = y;
								bone.roll = z;
						}
						${fabricOptions.members}
				}`,
		field: `private final ModelPart %(bone);`,
		bone: 
			 `%(bone) = new ModelPart(this);
			%(bone).setPivot(%(x), %(y), %(z));
			?(has_parent)%(parent).addChild(%(bone));
			?(has_rotation)setRotationAngle(%(bone), %(rx), %(ry), %(rz));
			%(cubes)`,
		renderer: `%(bone).render(matrixStack, buffer, packedLight, packedOverlay);`,
		cube: `%(bone).setTextureOffset(%(uv_x), %(uv_y)).addCuboid(%(x), %(y), %(z), %(dx), %(dy), %(dz), %(inflate), %(mirror));`,
	};
}

Plugin.register('modded_entity_fabric', {
	title: 'Modded Entity (Fabric)',
	icon: 'icon-format_java',
	author: 'Eliot Lash',
	description: 'Plugin for exporting Modded Entities for Fabric/Yarn API',
	min_version: '3.5.0',
	variant: 'both',
	onload() {
		loadFabricOptions();
		setTemplate();
		Blockbench.on('init_model', initModelCallback);
		// add a button to show the tips
		button = new Action('fabric_info', {
			name: 'Fabric Options',
			description: 'Stuff for Fabric support',
			icon: 'info',
			condition: () => Format,
			click: function () {
				// TODO This is a hack, replace this with metadata in the project file when this becomes possible
				loadFabricOptions();
				var dialog = new Dialog({
					id: 'project',
					title: 'Fabric Options',
					width: 540,
					form: {
						entity: {label: 'Entity Type', value: fabricOptions.entity || 'Entity'},
						header: {label: 'Code Header Injection', value: fabricOptions.header},
						render: {label: 'Render Code Injection', value: fabricOptions.render},
						members: {label: 'Code Extra Members Injection', value: fabricOptions.members},
					},
					onConfirm: function(formResult) {
						Object.assign(fabricOptions, formResult);
						localStorage.setItem(getStorageKey(), JSON.stringify(fabricOptions));
						setTemplate();
						dialog.hide()
					}
				})
				dialog.show()
			}
		});
		MenuBar.addAction(button, 'file.1');
	},
	onunload() {
		delete Codecs.modded_entity.templates['1.15'];
      // remove button when plugin is unloaded
			button.delete();
			Blockbench.removeListener('init_model', initModelCallback);
	}
});

})()
