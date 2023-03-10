import { SimplexNoise } from "./simplex-noise.js";

window.onload = function(e){ 

    const _gameConfig = {
        type: Phaser.AUTO,
        width: 1200,
        height: 800,
        backgroundColor: '#000000',
        pixelArt: true,
        scene: {
            preload: Preload,
            create: Create,
            update: GameTick
        }
    };

    const _mapConfig = {
        width: _gameConfig.width / 20,
        height: _gameConfig.height / 20,
        tileWidth: 20,
        tileHeight: 20
    };

    const _drawState = {
        Draw: 0,
        Clear: 1,
        Idle: 2
      };

    let _map; //Tilemap 
    let _path;

    //Preload
    function Preload () {
        this.load.image("tiles", "/assets/projects/pathfinding/resources/tileset.png");
    }

    //Create
    function Create () {
        Regenerate(this);

        this.input.keyboard.on("keydown-ENTER", function () {
            _map.destroy();
            Regenerate(this);
        }, this);

        this.input.on("pointerdown", function (pointer) {
            if (_path.state === _drawState.Idle){
                //Round mouse pointer world position down to the nearest tile
                let pointerTile = { x: _map.worldToTileX(pointer.x), y: _map.worldToTileY(pointer.y)};
            
                _path.endPos = pointerTile;
                _path.nodes = AStar(_map.layers[0].data, _path.startPos, _path.endPos);
                _path.idx = 0;
                _path.nextDisplay = 0;
                _path.state = _drawState.Draw;
            }
        }, this);
    }

    //GameTick
    function GameTick (time, delta) {
        if  (_path.state !== _drawState.Idle && (_path.nextDisplay > time || _path.nextDisplay === 0)) {
            if (_path.idx < _path.nodes.length) {
                let currentNode = _path.nodes[_path.idx];

                if (_path.state === _drawState.Draw) {
                    if (!currentNode.displayed) {
                        _map.putTileAt(10, currentNode.x, currentNode.y);
                        currentNode.displayed = true;

                        _path.idx++;
                        _path.nextDisplay = time + 1000;
                    }
                } else if (_path.state === _drawState.Clear) {
                    if (currentNode.displayed) {
                        if (_path.idx < _path.nodes.length - 1) {
                            _map.putTileAt(-1, currentNode.x, currentNode.y);
                        } else {
                            _path.startPos = {x: currentNode.x, y: currentNode.y};
                        }
                        
                        currentNode.displayed = false;
                        _path.idx++;
                        _path.nextDisplay = time + 1000;
                    }
                }
            } else {
                _path.idx = 0;
                _path.nextDisplay = 0;
                _path.state = _path.state + 1;
            }
        }
    }

    function Regenerate(scene) {
        _map = scene.make.tilemap({data: GenerateMap(_mapConfig.width, _mapConfig.height, 0, 9), tileWidth: _mapConfig.tileWidth, tileHeight: _mapConfig.tileHeight});
        _map.addTilesetImage("tiles");
        _map.createLayer(0, "tiles", 0, 0);
        _map.createBlankLayer("Layer Path", "tiles");

        _map.setLayer(1);
        _map.putTileAt(10, 0, 0); //Create path display tile at initial starting position

        _path = {
            startPos: {x: 0, y: 0}, //Starting position of the pathfinding path
            endPos: undefined,      //End position of the pathfinding path
            nodes: [],              //Array of nodes from @startPos to @endPos
            idx: 0,                 //Current index of @nodes being drawn/cleared
            nextDraw: 0,            //Time of when the next @idx can be drawn
            state: _drawState.Idle  //Current state - Draw/Clear/Idle
        };
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
                this.displayed = false;
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