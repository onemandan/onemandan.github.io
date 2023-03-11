import { SimplexNoise } from "./simplex-noise.js";

window.onload = function(e){ 

    const _gameConfig = {
        type: Phaser.AUTO,
        backgroundColor: '#000000',
        scale: {
            mode: Phaser.Scale.FIT,
            parent: "phaser-wrapper",
            width: 800,
            height: 800,
        },
        scene: {
            preload: Preload,
            create: Create
        }
    };

    const _mapConfig = {
        width: _gameConfig.scale.width / 20,
        height: _gameConfig.scale.height / 20,
        tileWidth: 20,
        tileHeight: 20
    };

    //Preload
    function Preload () {
        this.load.image("tiles", "/assets/projects/pathfinding/resources/tileset.png");
    }

    //Create
    function Create () {
        let map = this.make.tilemap({data: GenerateMap(_mapConfig.width, _mapConfig.height, 0, 9), tileWidth: _mapConfig.tileWidth, tileHeight: _mapConfig.tileHeight});
        map.addTilesetImage("tiles");
        map.createLayer(0, "tiles", 0, 0);
        map.createBlankLayer("Layer Path", "tiles");

        map.setLayer(1);
        map.putTileAt(10, 0, 0); //Create path display tile at initial starting position

        let pathNodes = AStar(map.layers[0].data, {x: 0, y: 0}, {x: 39, y: 39});

        for (let i = 0; i < pathNodes.length; i++) {
            map.putTileAt(10, pathNodes[i].x, pathNodes[i].y);
        }
    }

    //GenerateMap
    //Returns a 2D array (grid) populated with tile indexes ranging from @minIndex to @maxIndex, utilising Simplex Noise
    //@width - The width of the grid to create
    //@height - The height of the grid to create
    //@minIndex - The minimum tile index to populate the grid with
    //@maxIndex - The maximum tile index to populate the grid with
    function GenerateMap(width, height, minIndex, maxIndex) {
        let map = [];
        let gen = new SimplexNoise();

        //Noise
        //Returns a noise value based on @x and @y, rescaling from -1.0:+1.0 to 0.0:1.0
        //@x
        //@y
        function Noise(x, y) {
            return gen.noise2D(x, y) / 2 + 0.5;
        }

        for (let y = 0; y < height; y++) {
            map[y] = [];
            for (let x = 0; x < width; x++ ) {
                let nx = x/width - 0.5
                let ny = y/height - 0.5;

                map[y][x] = Math.floor(Noise(nx * 2.5, ny * 2.5) * (maxIndex - minIndex + 1)) + minIndex;
            }
        }

        return map;
    }

    function AStar(tiles, start, end) {
        
        class Node {
            constructor(x, y, weight) {
                this.x = x;
                this.y = y;
                this.g = 0;
                this.h = 0;
                this.f = 0;
                this.weight = weight + 1;
                this.parent = undefined;
                this.closed = false;
                this.visited = false;
            }

            Update(node, score) {
                this.visited = true;
                this.parent = node;
                this.g = score;
                this.h = this.#Heuristic(node.x, node.y);
                this.f = this.g + this.h;
            }

            Neighbours(grid, width, height) {
                let x = this.x;
                let y = this.y;
                let neighbours = [];

                //North
                if(y - 1 >= 0) {
                    neighbours.push(grid[y - 1][x]);
                }

                //South
                if(y + 1 < height) {
                    neighbours.push(grid[y + 1][x]);
                }

                //East
                if(x + 1 < width) {
                    neighbours.push(grid[y][x + 1]);
                }
                
                //West
                if(x - 1 >= 0) {
                    neighbours.push(grid[y][x - 1]);
                }
        
                return neighbours;
            }

            #Heuristic(x, y) {
                let d1 = Math.abs(this.x - x);
                let d2 = Math.abs(this.y - y);
                return d1 + d2;
            }
        }

        function InitGrid(width, height) {
            let grid = []

            for (let y = 0; y < height; y++) {
                grid[y] = []
                for (let x = 0; x < width; x++) {
                    let tile = tiles[y][x];

                    grid[y][x] = new Node(tile.x, tile.y, tile.index);
                }
            }

            return grid
        }

        let gridHeight = tiles.length; 
        let gridWidth = tiles[0].length;
        let gridNodes = InitGrid(gridWidth, gridHeight);
        let openNodes = [];

        //Set the end node and push the start node to the open list
        let endNode = gridNodes[end.y][end.x];
        openNodes.push(gridNodes[start.y][start.x]);

        //Loop until the open list is empty, if this ends up being the case, a path could not be found
        while (openNodes.length > 0) {
            //Get the node with the lowest f score in the open list
            let idx = 0;

            for (let i = 0; i < openNodes.length; i++) {
                if (openNodes[i].f < openNodes[idx].f) {
                    idx = i;
                }
            }

            let currentNode = openNodes[idx];

            //Check if the end goal has been reached and if it has, return the path
            if (currentNode === endNode) {
                let tempNode = currentNode;
                let path = [];

                //Loop through each parent of the temp node and push it to the path
                while (tempNode) {
                    path.push(tempNode);
                    tempNode = tempNode.parent;
                }

                return path.reverse();
            }

            //Remove the current node from the open list, and set it's closed status
            openNodes.splice(idx, 1);
            currentNode.closed = true;

            //Get the neighbours of the current node and loop through them
            let neighbourNodes = currentNode.Neighbours(gridNodes, gridWidth, gridHeight);

            for (let i = 0; i < neighbourNodes.length; i++) {
                let neighbourNode = neighbourNodes[i];

                //Skip any nodes that have already been calculated and closed 
                if (!neighbourNode.closed) {

                    //Get the traversal cost to the neighbour node
                    let gScore = currentNode.g + neighbourNode.weight;

                    if (!neighbourNode.visited || gScore < neighbourNode.g) {

                        //Only add the neighbour node to the open list if it has yet to be visited
                        if (!neighbourNode.visited) {
                            openNodes.push(neighbourNode);
                        }
                        
                        neighbourNode.Update(currentNode, gScore);
                    } 
                }
            }
        }

        return [];
    }

    new Phaser.Game(_gameConfig);
};