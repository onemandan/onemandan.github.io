import { createNoise2D } from "./simplex-noise.js";

window.onload = function(e){ 

    class Node {
        constructor(x, y, weight) {
            this.x = x;
            this.y = y;
            this.g = 0;
            this.h = 0;
            this.f = 0;
            this.weight = weight;
            this.parent = undefined;
            this.closed = false;
            this.visited = false;
        }

        Update(pNode, gScore, hScore) {
            this.visited = true;
            this.parent = pNode;
            this.g = gScore;
            this.h = hScore;
            this.f = this.g + this.h;
        }
    }

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

    let _noise2D;
    let _tilemap;

    //Preload
    function Preload () {
        this.load.image("tiles", "/assets/projects/pathfinding/resources/tileset.png");
    }

    //Create
    function Create () {
        DrawTilemapPath(GenerateTilemap(this));

        this.input.keyboard.on("keydown-ENTER", function () {
            _tilemap.destroy();

            DrawTilemapPath(GenerateTilemap(this));
        }, this);
    }

    function DrawTilemapPath(grid) {
        //Get a path from the top left corner, to the bottom right corner
        let pathNodes = AStar(grid, {x: 0, y: 0}, {x: _mapConfig.width - 1, y: _mapConfig.height - 1});

        for (let i = 0; i < pathNodes.length; i++) {
            _tilemap.putTileAt(10, pathNodes[i].x, pathNodes[i].y);
        }
    }

    function GenerateTilemap(scene) {
        _noise2D = createNoise2D(); //Recreate the noise2D function so ensure a new seed

        let grid = GenerateGrid(_mapConfig.width, _mapConfig.height, 0, 9);

        _tilemap = scene.make.tilemap({data: grid, tileWidth: _mapConfig.tileWidth, tileHeight: _mapConfig.tileHeight});
        _tilemap.addTilesetImage("tiles");
        _tilemap.createLayer(0, "tiles");
        _tilemap.createBlankLayer(1, "tiles");
        _tilemap.setLayer(1);
        _tilemap.putTileAt(10, 0, 0); //Create path display tile at initial starting position

        return grid;
    }

    //GenerateMap
    //Returns a 2D array (grid) populated with tile indexes ranging from @minIndex to @maxIndex, utilising Simplex Noise
    //@width - The width of the grid to create
    //@height - The height of the grid to create
    //@minIndex - The minimum tile index to populate the grid with
    //@maxIndex - The maximum tile index to populate the grid with
    function GenerateGrid(width, height, minIndex, maxIndex) {
        let grid = [];

        //Noise
        //Returns a noise value based on @x and @y, rescaling from -1.0:+1.0 to 0.0:1.0
        //@x
        //@y
        function Noise(x, y) {
            return _noise2D(x, y) / 2 + 0.5;
        }

        for (let y = 0; y < height; y++) {
            grid[y] = [];
            for (let x = 0; x < width; x++ ) {
                grid[y][x] = Math.round(Noise(x / 16, y / 16) * (maxIndex - minIndex) + minIndex);
            }
        }

        return grid;
    }

    //AStar
    //
    function AStar(grid, start, end) {

        function InitGrid() {
            let gridNodes = []

            for (let y = 0; y < grid.length; y++) {
                gridNodes[y] = []
                for (let x = 0; x < grid[0].length; x++) {
                    gridNodes[y][x] = new Node(x, y, grid[y][x] + 1);
                }
            }

            return gridNodes
        }

        function Neighbours(currentNode, gridNodes) {
            let x = currentNode.x;
            let y = currentNode.y;
            let neighbours = [];

            //North
            if(gridNodes[y - 1]) {
                neighbours.push(gridNodes[y - 1][x]);
            }

            //South
            if(gridNodes[y + 1]) {
                neighbours.push(gridNodes[y + 1][x]);
            }

            //East
            if(gridNodes[y][x + 1]) {
                neighbours.push(gridNodes[y][x + 1]);
            }
            
            //West
            if(gridNodes[y][x - 1]) {
                neighbours.push(gridNodes[y][x - 1]);
            }
    
            return neighbours;
        }

        function Heuristic(node1, node2) {
            let d1 = Math.abs(node1.x - node2.x);
            let d2 = Math.abs(node1.y - node2.y);
            return d1 + d2;
        }

        let gridNodes = InitGrid();
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

            //Remove the current node from the open list, and set its closed status
            openNodes.splice(idx, 1);
            currentNode.closed = true;

            //Get the neighbours of the current node and loop through them
            let neighbourNodes = Neighbours(currentNode, gridNodes);

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
                        
                        neighbourNode.Update(currentNode, gScore, Heuristic(neighbourNode, endNode));
                    } 
                }
            }
        }

        return [];
    }

    new Phaser.Game(_gameConfig);
};