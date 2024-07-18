import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/Addons.js";
import { RNG } from "./rng";
import { blocks, resources } from "./blocks";

const geo = new THREE.BoxGeometry();
const mat = new THREE.MeshLambertMaterial();

// mat.onBeforeCompile = (shader) => {
//     shader.vertexShader = shader.vertexShader.replace("#include <common>", `
//         flat varying int instanceId;
//         #include <common>
//     `)

//     shader.vertexShader = shader.vertexShader.replace("}", `
//         instanceId = gl_InstanceID;
//     }
//     `)

//     shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `
//        flat varying int instanceId;
//         #include <common>
//     `)

//     shader.fragmentShader = shader.fragmentShader.replace("}", `
//             gl_FragColor = vec4(float(instanceId)*0.0001,float(instanceId)*0.0001,float(instanceId)*0.0001,1.0);

//         }
//     `)
// }

type SizeParam = {
    width: number,
    height: number
}

export class World extends THREE.Group {
    size: SizeParam
    data: { id: number, instanceId: number }[][][] = []
    params = {
        seed: 0,
        terrain: {
            scale: 30,
            magnitude: 0.5,
            offset: 0.2
        }
    };

    constructor(size: SizeParam = { width: 32, height: 32 }) {
        super();
        this.size = size
    }

    //generate the world terrain data
    generateMeshes() {
        this.clear();
        const maxCount = this.size.width * this.size.width * this.size.height;

        const meshes:{[id:number]:THREE.InstancedMesh} = {};
        Object.values(blocks)
            .filter(blockType => blockType.id !== blocks.empty.id)
            .forEach(blockType => {
                //@ts-ignore
                const mesh = new THREE.InstancedMesh(geo, blockType.material, maxCount);
                mesh.name = blockType.name;
                mesh.count = 0;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                meshes[blockType.id] = mesh;
            })

        const mesh = new THREE.InstancedMesh(geo, mat, maxCount);
        mesh.count = 0;
        const matrix = new THREE.Matrix4();
        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                for (let z = 0; z < this.size.width; z++) {
                    const blockId = this.getBlock(x, y, z)?.id;
                    if(blockId === undefined || blockId === blocks.empty.id) continue;

                    const mesh = meshes[blockId];
                    const instanceId = mesh.count
                    if (!this.isBlockObscured(x, y, z)) {
                        matrix.setPosition(x, y, z);
                        mesh.setMatrixAt(instanceId, matrix);
                        this.setBlockInstanceId(x, y, z, instanceId);
                        mesh.count++;
                    }
                }
            }
        }
        this.add(...Object.values(meshes));
    }

    inBounds(x: number, y: number, z: number) {
        return (x >= 0 && x < this.size.width) && (y >= 0 && y < this.size.height) && (z >= 0 && z < this.size.width)
    }

    getBlock(x: number, y: number, z: number) {
        if (this.inBounds(x, y, z)) {
            return this.data[x][y][z]
        }
        return null
    }

    setBlockId(x: number, y: number, z: number, id: number) {
        if (this.inBounds(x, y, z)) {
            this.data[x][y][z].id = id
        }
    }

    setBlockInstanceId(x: number, y: number, z: number, instanceId: number) {
        if (this.inBounds(x, y, z)) {
            this.data[x][y][z].instanceId = instanceId
        }
    }

    initializeTerrain() {
        this.data = [];
        for (let x = 0; x < this.size.width; x++) {
            const slice = [];
            for (let y = 0; y < this.size.height; y++) {
                const row = [];
                for (let z = 0; z < this.size.width; z++) {
                    row.push({
                        id: blocks.empty.id,
                        instanceId: 0
                    })
                }
                slice.push(row);
            }
            this.data.push(slice);
        }
    }

    generateResources(rng: RNG) {
        const simplex = new SimplexNoise(rng);
        resources.forEach(resource => {
            for (let x = 0; x < this.size.width; x++) {
                for (let y = 0; y < this.size.height; y++) {
                    for (let z = 0; z < this.size.width; z++) {
                        const value = simplex.noise3d(x / resource.scale.x, y / resource.scale.y, z / resource.scale.z);
                        if (value > resource.scarcity) {
                            this.setBlockId(x, y, z, resource.id)
                        }
                    }
                }
            }
        })
    }

    generateTerrain(rng: RNG) {
        const simplex = new SimplexNoise(rng);
        for (let x = 0; x < this.size.width; x++) {
            for (let z = 0; z < this.size.width; z++) {
                const value = simplex.noise(x / this.params.terrain.scale
                    , z / this.params.terrain.scale);
                const scaledNoise = this.params.terrain.offset + this.params.terrain.magnitude * value;
                let height = Math.floor(this.size.height * scaledNoise);
                height = Math.max(0, Math.min(height, this.size.height - 1));

                for (let y = 0; y < this.size.height; y++) {
                    if (y < height && this.getBlock(x, y, z)?.id === blocks.empty.id) {
                        this.setBlockId(x, y, z, blocks.dirt.id);
                    } else if (y === height) {
                        this.setBlockId(x, y, z, blocks.grass.id);
                    } else if (y > height) {
                        this.setBlockId(x, y, z, blocks.empty.id);
                    }
                }
            }
        }
    }

    generate() {
        const rng = new RNG(this.params.seed);
        this.initializeTerrain();
        this.generateResources(rng);
        this.generateTerrain(rng);
        this.generateMeshes()
    }

    isBlockObscured(x: number, y: number, z: number) {
        const emptyId = blocks.empty.id;
        return !(
            (this.getBlock(x, y + 1, z)?.id === emptyId) ||
            (this.getBlock(x, y - 1, z)?.id === emptyId) ||
            (this.getBlock(x, y, z + 1)?.id === emptyId) ||
            (this.getBlock(x, y, z - 1)?.id === emptyId) ||
            (this.getBlock(x + 1, y, z)?.id === emptyId) ||
            (this.getBlock(x - 1, y, z)?.id === emptyId)
        )
    }
}
