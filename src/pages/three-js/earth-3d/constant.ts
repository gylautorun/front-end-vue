export const vertexShader = `
attribute float aOpacity;
uniform float uSize;
varying float vOpacity;

void main(){
    gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);
    gl_PointSize = uSize;

    vOpacity=aOpacity;
}
`
export const fragmentShader = `
varying float vOpacity;
uniform vec3 uColor;

float invert(float n){
    return 1.-n;
}

void main(){
    if(vOpacity <=0.2){
        discard;
    }
    vec2 uv=vec2(gl_PointCoord.x,invert(gl_PointCoord.y));
    vec2 cUv=2.*uv-1.;
    vec4 color=vec4(1./length(cUv));
    color*=vOpacity;
    color.rgb*=uColor;

    gl_FragColor=color;
}
`