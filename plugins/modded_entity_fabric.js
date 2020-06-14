(function() {

Plugin.register('modded_entity_template', {
	title: 'Modded Entity Template',
	icon: '',
	author: '',
	description: '',
	min_version: '3.5.0',
	onload() {
		Codecs.modded_entity.templates['1.15'] = {
			name: '1.15',
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
					public void setRotationAngles(Entity entity, float limbSwing, float limbSwingAmount, float ageInTicks, float netHeadYaw, float headPitch){
						//previously the render function, render code was moved to a method below
					}
	
					@Override
					public void render(MatrixStack matrixStack, IVertexBuilder buffer, int packedLight, int packedOverlay, float red, float green, float blue, float alpha){
						%(renderers)
					}
	
					public void setRotationAngle(ModelRenderer modelRenderer, float x, float y, float z) {
						modelRenderer.rotateAngleX = x;
						modelRenderer.rotateAngleY = y;
						modelRenderer.rotateAngleZ = z;
					}
				}`,
			field: `private final ModelRenderer %(bone);`,
			bone: 
			  `%(bone) = new ModelRenderer(this);
				%(bone).setRotationPoint(%(x), %(y), %(z));
				?(has_parent)%(parent).addChild(%(bone));
				?(has_rotation)setRotationAngle(%(bone), %(rx), %(ry), %(rz));
				%(cubes)`,
			renderer: `%(bone).render(matrixStack, buffer, packedLight, packedOverlay);`,
			cube: `%(bone).setTextureOffset(%(uv_x), %(uv_y)).addBox(%(x), %(y), %(z), %(dx), %(dy), %(dz), %(inflate), %(mirror));`,
		}
	},
	onunload() {
		delete Codecs.modded_entity.templates['1.15'];
	}
});

})()
