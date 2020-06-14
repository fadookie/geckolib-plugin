(function() {

Plugin.register('modded_entity_template', {
	title: 'Modded Entity (Fabric)',
	icon: 'icon-format_java',
	author: 'Eliot Lash',
	description: 'Plugin for exporting Modded Entities for Fabric/Yarn API',
	min_version: '3.5.0',
	onload() {
		Codecs.modded_entity.templates['1.15'] = {
			name: '1.15 - Fabric',
			flip_y: true,
			integer_size: false,
			file: 
				 `// Made with Blockbench %(bb_version)
					// Exported for Minecraft version 1.15
					// Paste this class into your mod and generate all required imports
					public class %(identifier) extends EntityModel<Entity> {
							%(fields)
							public %(identifier)() {
									textureWidth = %(texture_width);
									textureHeight = %(texture_height);
									%(content)
							}
							@Override
							public void setAngles(Entity entity, float limbSwing, float limbSwingAmount, float ageInTicks, float netHeadYaw, float headPitch){
									//previously the render function, render code was moved to a method below
							}
							@Override
							public void render(MatrixStack matrixStack, VertexConsumer  buffer, int packedLight, int packedOverlay, float red, float green, float blue, float alpha){
									%(renderers)
							}
							public void setRotationAngle(ModelPart tbone, float x, float y, float z) {
									bone.pitch = x;
									bone.yaw = y;
									bone.roll = z;
							}
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
	}
	},
	onunload() {
		delete Codecs.modded_entity.templates['1.15'];
	}
});

})()
