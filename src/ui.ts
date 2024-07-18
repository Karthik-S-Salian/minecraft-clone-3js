import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import { World } from "./world";
import {  resources } from "./blocks";
import { Player } from "./player";

export function createUI(world: World,player:Player) {
    const gui = new GUI();

    const playerFolder = gui.addFolder("Player");
    playerFolder.add(player.cameraHelper,"visible").name("Show Camera Helper");
    playerFolder.add(player,"maxSpeed",1,20).name("Max Speed");
    
    gui.add(world.size, "width", 8, 128, 1).name("Width");
    gui.add(world.size, "height", 8, 128, 1).name("Height");

    const terrainFolder = gui.addFolder("Terrain");
    terrainFolder.add(world.params, "seed", 0, 1000).name("seed");
    terrainFolder.add(world.params.terrain, "scale", 10, 100).name("Scale");
    terrainFolder.add(world.params.terrain, "magnitude", 0, 1).name("magnitude");
    terrainFolder.add(world.params.terrain, "offset", 0, 1).name("Offset");

    const resourcesFolder = gui.addFolder("Resources");
    resources.forEach(resource => {
        const resourceFolder = resourcesFolder.addFolder(resource.name)
        resourceFolder.add(resource, "scarcity", 0, 1).name("scarcity");
        resourceFolder.add(resource.scale, "x", 10, 100).name("X scale");
        resourceFolder.add(resource.scale, "y", 10, 100).name("Y scale");
        resourceFolder.add(resource.scale, "z", 10, 100).name("Z scale");
    })

    gui.onChange(() => {
        world.generate();
    })
}