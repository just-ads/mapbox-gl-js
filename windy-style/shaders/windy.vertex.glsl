#include "_prelude_fog.vertex.glsl"

#define RASTER_CLOUD_PIXEL (9.0 / 265.0)

uniform mat4 u_matrix;

in vec2 a_pos;
in vec2 a_texture_pos;

out vec2 v_pos;

void main() {
    // float w = 1.0 + dot(a_texture_pos, vec2(0.0, 0.0));
    gl_Position = u_matrix * vec4(a_pos, 0, 1.0);
    // We are using Int16 for texture position coordinates to give us enough precision for
    // fractional coordinates. We use 8192 to scale the texture coordinates in the buffer
    // as an arbitrarily high number to preserve adequate precision when rendering.
    // This is also the same value as the EXTENT we are using for our tile buffer pos coordinates,
    // so math for modifying either is consistent.
    v_pos = a_texture_pos / 8192.0;

#ifndef NORMAL
    // windy 带颜色条的瓦片
    v_pos.y = v_pos.y * (1.0 - RASTER_CLOUD_PIXEL) + RASTER_CLOUD_PIXEL;
#endif

#ifdef FOG
    v_fog_pos = fog_position(a_pos);
#endif
}
