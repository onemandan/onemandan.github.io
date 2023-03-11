/* jshint esversion: 6 */
/* global Phaser, window */

window.onload = function(e){ 

    const _colourPrimary = 0xFFFFFF;        //White
    const _colourSecondary = 0x000000;      //Black
    const _colourTertiary = 0xFF9100;       //Orange
    const _mapDividerIndex = 18;            //Tile number which separates the main tile palcement area from the tile selection area
    const _layerMain = "Tile Layer 1";      //Default (main) tile layer
    const _layerPreview = "Tile Layer 2";   //Preview tile layer (opacity 0.5)
    
    let _map;           //Main game tilemap
    let _markerMap;     //Marker graphic representing mouse position
    let _markerTile;    //Marker graphic representing tile selection
    let _tileIndex;     //Selected tile index represented by @_markerTile, to place at @_markerMap on mouse down   
    let _Keys;          //Input arrow cursors from the 'keyboard' namespace
    
    let _previewTile = { x: 0, y: 0, placed: false };  //Preview tile last placed position
    
    //Create Phaser game with config
    new Phaser.Game({
        type: Phaser.AUTO,
        backgroundColor: '#000000',
        scale: {
            mode: Phaser.Scale.FIT,
            parent: "phaser-wrapper",
            width: 576,
            height: 864,
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    });
    
    function preload ()
    {        
        this.load.tilemapTiledJSON("map", "/assets/projects/tilemap-editor/resources/tilemap.json");
        this.load.image("tiles", "/assets/projects/tilemap-editor/resources/tileset.png");
    }

    function create ()
    {
        //Setup arrow keys
        _Keys = {
            left:   this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            up:     this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            down:   this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)
        };
        
        //Create the map from the loaded tilemap JSON
        _map = this.make.tilemap({ key: "map" });
        let tiles = _map.addTilesetImage("tiles");
        
        _map.createLayer(_layerMain, tiles);
        _map.createBlankLayer(_layerPreview, tiles).setAlpha(0.5);
        
        //Set map to the main layer
        _map.setLayer(_layerMain);
        
        //Create gridlines for tileset selection area
        let gridLineYPos = (_mapDividerIndex + 1) * _map.tileHeight;
        let gridLineHeight = _map.tileHeight * (_map.height - _mapDividerIndex);
        let gridLineWidth = _map.tileWidth * _map.width;
        
        //Gridlines: Loop through the X plane per tile to place a line every tile width
        for (let i = 0; i < _map.width; i++) {
            CreateGraphic(this, 1, gridLineHeight, 1, _colourSecondary, _map.tileWidth * i, gridLineYPos);
        }
        
        //Gridlines: Loop through the Y plane per tile, starting from @_mapDividerIndex, to place a line every tile height
        for (let i = _mapDividerIndex; i < _map.height; i++) {
            CreateGraphic(this, gridLineWidth, 1, 1, _colourSecondary, 0, _map.tileHeight * i);
        }
        
        //Create markers to show mouse position and tile selection
        _markerMap = CreateGraphic(this, _map.tileWidth, _map.tileHeight, 3, _colourPrimary);
        _markerTile = CreateGraphic(this, _map.tileWidth, _map.tileHeight, 3, _colourTertiary, 0, _map.tileToWorldY(_mapDividerIndex + 1));
        
        //Set default tile index, currently at tile X: 0, Y: @_mapDividerIndex + 1
        _tileIndex = _map.getTileAt(0, _map.worldToTileY(_markerTile.y)).index;
        
        //Set default preview tile
        UpdatePreviewTile(_map.worldToTileX(_markerMap.x), _map.worldToTileY(_markerMap.y));
        
        //Add helper text
        this.add.text(_map.tileWidth / 4, (_map.tileHeight * _mapDividerIndex) + (_map.tileHeight / 4), "Select a tile from the palette below, click above to place", {
            fontSize: "16px",
            fill: "#FFFFFF"
        });
    }

    function update (time, delta)
    {
        //Mouse input
        //Get mouse pointer in world space
        let worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);
    
        //Round mouse pointer world position down to the nearest tile
        let pointerTile = { x: _map.worldToTileX(worldPoint.x), y: _map.worldToTileY(worldPoint.y)};
        
        //Ensure the mouse position is currently within the game canvas' bounds
        if (pointerTile.y >= 0 && pointerTile.y < _map.height && pointerTile.x >= 0 && pointerTile.x < _map.width) {
            
            //Mouse is within the main tile area
            if (pointerTile.y < _mapDividerIndex) {
                
                //Update map marker position to show current tile
                _markerMap.setPosition(_map.tileToWorldX(pointerTile.x), _map.tileToWorldY(pointerTile.y));
                
                //On mouse down:
                //-Place tile at current position, based on the selected tile (@_tileIndex)
                if (this.input.manager.activePointer.isDown) {
                    _map.putTileAt(_tileIndex, pointerTile.x, pointerTile.y);
                }
            //Mouse is within the tile selection area
            } else if (pointerTile.y > _mapDividerIndex) {
                
                if (this.input.manager.activePointer.isDown) {
                    UpdateTileMarker(pointerTile.x, pointerTile.y);
                }
            }
        }
        
        //Keyboard input
        //Left arrow key: Min 0, decrease X, wrap to _map.width
        if (Phaser.Input.Keyboard.JustDown(_Keys.left)) {
            if (_map.worldToTileX(_markerTile.x) > 0) {
                UpdateTileMarker(_map.worldToTileX(_markerTile.x) - 1, _map.worldToTileX(_markerTile.y));
            } else {
                UpdateTileMarker(_map.width - 1, _map.worldToTileX(_markerTile.y));
            }
        }
        
        //Right arrow key: Max _map.width, increase X, wrap to 0
        if (Phaser.Input.Keyboard.JustDown(_Keys.right)) {
            if (_map.worldToTileX(_markerTile.x) < _map.width - 1) {
                UpdateTileMarker(_map.worldToTileX(_markerTile.x) + 1, _map.worldToTileX(_markerTile.y));
            } else {
                UpdateTileMarker(0, _map.worldToTileX(_markerTile.y));
            }
        }
        
        //Up arrow key: Min _mapDividerIndex, decrease Y, wrap to _map.height
        if (Phaser.Input.Keyboard.JustDown(_Keys.up)) {
            if (_map.worldToTileY(_markerTile.y) > _mapDividerIndex + 1) {
                UpdateTileMarker(_map.worldToTileX(_markerTile.x), _map.worldToTileX(_markerTile.y) - 1);
            } else {
                UpdateTileMarker(_map.worldToTileX(_markerTile.x), _map.height - 1);
            }
        }
        
        //Down arrow key: Max _map.height, increase Y, wrap to _mapDividerIndex
        if (Phaser.Input.Keyboard.JustDown(_Keys.down)) {
            if (_map.worldToTileY(_markerTile.y) < _map.height - 1) {
                UpdateTileMarker(_map.worldToTileX(_markerTile.x), _map.worldToTileX(_markerTile.y) + 1);
            } else {
                UpdateTileMarker(_map.worldToTileX(_markerTile.x), _mapDividerIndex + 1);
            }
        }
        
        //Update the preview tile based on the current position to show a preview before placement
        UpdatePreviewTile(_map.worldToTileX(_markerMap.x), _map.worldToTileY(_markerMap.y));
    }
    
    //UpdateTileMarker
    //Updates the position of @_markerTile, updates @_tileIndex and update flag of @_previewTile.placed
    //@posX - X position in tile space
    //@posY - Y position in tile space
    function UpdateTileMarker(posX, posY) {
        _markerTile.setPosition(_map.tileToWorldX(posX), _map.tileToWorldY(posY));
        _previewTile.placed = false;
        
        _tileIndex = _map.getTileAt(posX, posY).index;
    }
    
    //UpdatePreviewTile
    //Updated the preview tile on the upper map layer, which acts as a preview of the tile to be placed
    //@posX - X position in tile space
    //@posY - Y position in tile space
    function UpdatePreviewTile(posX, posY) {
        
        //Update map layer to the preview layer
        _map.setLayer(_layerPreview);
        
        //If the previously placed preview tiles position is not equal to the current position:
        //-Remove the previous preview tile
        //-Update the preview tile position
        if (_previewTile.x != posX || _previewTile.y != posY) {
            _map.removeTileAt(_previewTile.x, _previewTile.y);
            _previewTile.placed = false;
            
            _previewTile.x = posX;
            _previewTile.y = posY;
        }
        
       if (!_previewTile.placed) {
            //Place the preview tile at the given position
            _map.putTileAt(_tileIndex, _previewTile.x, _previewTile.y);
            
            _previewTile.placed = true;
        }
        
        //Revert map to the main layer
        _map.setLayer(_layerMain);
    }
    
    //CreateGraphic
    //Creates a graphic in the given scene
    //@scene - Game scene
    //@width - Width of the graphic 
    //@height - Height of the graphic 
    //@weight - Line weight of he graphic
    //@colour - Line colour of the graphic
    //@posX - OPTIONAL - X position in world space
    //@posY - OPTIONAL - Y position in world space
    function CreateGraphic(scene, width, height, weight, colour, posX = 0, posY = 0) {
        let graphic = scene.add.graphics();
        
        graphic.lineStyle(weight, colour);
        graphic.strokeRect(0, 0, width, height);
        graphic.setPosition(posX, posY);
        
        return graphic;
    }
};