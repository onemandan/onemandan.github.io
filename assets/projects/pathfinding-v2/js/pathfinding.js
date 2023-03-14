import { createNoise2D } from "./simplex-noise.js";

window.onload = function(e){ 

    class Node {
        constructor(x, y, weight) {
            this.x = x;
            this.y = y;
            this.g = 0;
            this.h = 0;
            this.f = 0;
            this.traversable = weight < 9;
            this.weight = (weight > 6 ? weight * 10 : weight);
            this.parent = undefined;
            this.closed = false;
            this.visited = false;
            this.displayed = false;
        }

        Update(pNode, gScore, hScore) {
            this.visited = true;
            this.parent = pNode;
            this.g = gScore;
            this.h = hScore;
            this.f = this.g + this.h;
        }
    }

    //Config containing Phaser 3 information
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
            create: Create,
            update: GameTick
        }
    };

    //Config containing map information
    const _mapConfig = {
        width: _gameConfig.scale.width / 20,
        height: _gameConfig.scale.height / 20,
        tileWidth: 20,
        tileHeight: 20
    };

    //Enum Heuristic functions
    const _heuristic = {
        manhattan: 0,
        chebyshev: 1
    };

    //Enum state machine for drawing and clearing a path
    const _drawState = {
        Draw: 0,
        Clear: 1,
        Idle: 2
    };

    const _baseTraversalSpeed = 10; //Base amount of time for the next node to be drawn to the tilemap

    let _noise2D;   //Simplex Noise function
    let _tilemap;   //Tilemap to be rendered
    let _path;      //Path object containing nodes to draw and state machine

    //Preload
    //Load the tileset image
    function Preload () {
        this.load.image("tiles", "/assets/projects/pathfinding-v2/resources/tileset.png");
    }

    //Create
    //Create the enter key and mousedown listeners, as well as generate the tilemap on initial load
    function Create () {
        let grid = GenerateTilemap(this);

        //Enter key event listener, destroy and regenerate tilemap
        this.input.keyboard.on("keydown-ENTER", function () {
            _tilemap.destroy();
            grid = GenerateTilemap(this);
        }, this);

        //Mouse down event listener, get path to draw from the A* algorithm, based on start and end position defined by the user
        this.input.on("pointerdown", function (pointer) {
            if (_path.state === _drawState.Idle){
                //Round mouse pointer world position down to the nearest tile
                let pointerTile = { x: _tilemap.worldToTileX(pointer.x), y: _tilemap.worldToTileY(pointer.y)};
                
                //Base tilemap layer
                _tilemap.setLayer(0);

                //Do not allow the user to click a land tileset index
                if (_tilemap.getTileAt(pointerTile.x, pointerTile.y).index < 6) {
                    _path.endPos = pointerTile;
                    _path.nodes = AStar(grid, _path.startPos, _path.endPos);

                    if(_path.nodes.length > 0) {
                        _path.idx = 0;
                        _path.time = 0;
                        _path.state = _drawState.Draw;
                    } else {
                        this.cameras.main.shake(200, 0.01);
                    }
                } else {
                    this.cameras.main.shake(200, 0.01);
                }

                //Path tilemap layer
                _tilemap.setLayer(1);
            }
        }, this);
    }

    //GameTick
    //Update function called each game tick, utilised to draw/clear the path on the tilemap, based on the @_path draw state
    //@time
    //@delta
    function GameTick (time, delta) {
        if  (_path.state !== _drawState.Idle && (time > _path.time || _path.time === 0)) {
            if (_path.idx < _path.nodes.length) {
                let currentNode = _path.nodes[_path.idx];

                if (_path.state === _drawState.Draw) {
                    _tilemap.putTileAt(10, currentNode.x, currentNode.y);
                    _path.time = time + (_baseTraversalSpeed * currentNode.weight);

                } else if (_path.state === _drawState.Clear) {
                    if (_path.idx < _path.nodes.length - 1) {
                        _tilemap.putTileAt(-1, currentNode.x, currentNode.y);
                    } else {
                        _path.startPos = {x: currentNode.x, y: currentNode.y};
                    }
                }

                _path.idx++;
            } else {
                _path.idx = 0;
                _path.time = 0;
                _path.state = _path.state + 1;
            }
        }
    }

    //GenerateTilemap
    //Seed the Simplex Noise function and generate a random tilemap, as well as initialise the @_path object
    //@scene - Phaser object
    function GenerateTilemap(scene) {
        _noise2D = createNoise2D(); //Recreate the noise2D function so ensure a new seed

        let grid = GenerateGrid(_mapConfig.width, _mapConfig.height, 0, 9);

        _tilemap = scene.make.tilemap({data: grid, tileWidth: _mapConfig.tileWidth, tileHeight: _mapConfig.tileHeight});
        _tilemap.addTilesetImage("tiles");
        _tilemap.createLayer(0, "tiles");
        _tilemap.createBlankLayer(1, "tiles");
        _tilemap.setLayer(1);
        _tilemap.putTileAt(10, 0, 0); //Create path display tile at initial starting position

        _path = {
            startPos: {x: 0, y: 0}, //Starting position of the pathfinding path
            endPos: undefined,      //End position of the pathfinding path
            nodes: [],              //Array of nodes from @startPos to @endPos
            idx: 0,                 //Current index of @nodes being drawn/cleared
            time: 0,                //The time at which the node can be drawn
            state: _drawState.Idle  //Current state - Draw/Clear/Idle
        };

        return grid;
    }

    //GenerateGrid
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
    //Search a 2D array to find a path from a start position to an end position, based on the given @options
    //@grid - 2D array to search
    //@start - {x, y} object for the search start position
    //@end - {x, y} object for the search end position
    //@options - Object that contains which heuristic to use, and whether or not diagonal traversal is allowed
    function AStar(grid, start, end, options = {}) {

        //InitGrid
        //Initialise a grid with nodes
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

        //Neighbours
        //Obtains the neighbours of a given node
        //@currentNode - The node to obtain neighbours from within @gridNodes
        //@gridNodes - 2D array to obtain neighbours near @currentNode
        function Neighbours(currentNode, gridNodes) {
            let x = currentNode.x;
            let y = currentNode.y;
            let neighbours = [];

            //Adjacent Nodes
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

            if (options.diagonal) {
                //Diagonal Nodes
                //North East
                if(gridNodes[y - 1] && gridNodes[y][x + 1]) {
                    neighbours.push(gridNodes[y - 1][x + 1]);
                }

                //South East
                if(gridNodes[y + 1] && gridNodes[y][x + 1]) {
                    neighbours.push(gridNodes[y + 1][x + 1]);
                }

                //South West
                if(gridNodes[y + 1] && gridNodes[y][x - 1]) {
                    neighbours.push(gridNodes[y + 1][x - 1]);
                }

                //North West
                if(gridNodes[y - 1] && gridNodes[y][x - 1]) {
                    neighbours.push(gridNodes[y - 1][x - 1]);
                }
            }
    
            return neighbours;
        }

        //Heuristic
        //Obtains the heuristic cost between two nodes
        //@node1
        //@node2
        function Heuristic(node1, node2) {
            let d1 = Math.abs(node1.x - node2.x);
            let d2 = Math.abs(node1.y - node2.y);

            if (options.heuristic === _heuristic.manhattan) {
                return d1 + d2;
            } else if (options.heuristic === _heuristic.chebyshev) {
                return Math.max(d1, d2);
            }
        }

        //Ensure options have been set
        options.diagonal = options.diagonal || false;
        options.heuristic = options.heuristic || _heuristic.manhattan;

        //Initialise grid and open list
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
                if (!neighbourNode.closed && neighbourNode.traversable) {

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