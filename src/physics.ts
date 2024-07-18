import * as THREE from 'three'
import { Player } from './player';
import { World } from './world';
import { blocks } from './blocks';

const collisionMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.2
});
const collisionGeometry = new THREE.BoxGeometry(1.001, 1.001, 1.001);

export class Physics {
    helpers: THREE.Group;
    constructor(scene: THREE.Scene) {
        this.helpers = new THREE.Group();
        scene.add(this.helpers);
    }

    update(dt: number, player: Player, world: World) {
        this.detectCollisions(player, world);
    }

    detectCollisions(player: Player, world: World) {
        const candidates = this.broadPhase(player, world);
        const collisions = this.narrowPhase(candidates, player);

        // if (collisions.length > 0) {
        //     this.resolveCollisions(collisions);
        // }
    }
    resolveCollisions(collisions: void) {

    }

    narrowPhase(candidates: { x:number,y:number,z:number }[], player: Player) {
        const collisions=[];

        //point on the block closest to the center of the  player
        for(const block of candidates){
            const p = player.position;
            const closestPoint = {
                x:Math.max(block.x-0.5,Math.min(p.x,block.x+0.5)),
                y:Math.max(block.y-0.5,Math.min(p.y - (player.height/2),block.y+0.5)),
                z:Math.max(block.z-0.5,Math.min(p.z,block.z+0.5))
            }
        }
        return collisions;
    }   

    broadPhase(player: Player, world: World) {
        this.helpers.clear();
        const candidates = [];

        const extents = {
            x: {
                min: Math.floor(player.position.x - player.radius),
                max: Math.ceil(player.position.x + player.radius)
            },
            y: {
                min: Math.floor(player.position.y - player.height),
                max: Math.floor(player.position.y)
            },
            z: {
                min: Math.floor(player.position.z - player.radius),
                max: Math.ceil(player.position.z + player.radius)
            }
        }

        for (let x = extents.x.min; x < extents.x.max; x++) {
            for (let y = extents.y.min; y < extents.y.max; y++) {
                for (let z = extents.z.min; z < extents.z.max; z++) {
                    const block = world.getBlock(x, y, z);
                    if (block && block.id != blocks.empty.id) {
                        candidates.push({x,y,z});
                        this.addCollisionHelper({x,y,z});
                    }
                }
            }
        }

        return candidates;
    }

    addCollisionHelper(blockPos:{x:number,y:number,z:number}){
        const blockMesh = new THREE.Mesh(collisionGeometry,collisionMaterial);
        blockMesh.position.copy(new THREE.Vector3(...Object.values(blockPos)));
        this.helpers.add(blockMesh);
    }
}