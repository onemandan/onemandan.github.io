---
layout: post
title: Phaser Tilemap Editor
description: Dynamic tilemap editor using Phaser 3
icon: fa-rocket
technologies:
    - Phaser 3
    - JavaScript
---

<div class="alert alert-info" role="alert">
    <div class="d-flex justify-content-center">
        <span>
            <strong>Note:</strong> Access and use the final project <a href="/projects/tilemap-editor.html">here</a>.  Review the code <a href="/assets/projects/tilemap-editor/js/tilemap-editor.js">here</a>.
        </span>
    </div>
</div>

Recently, I had the urge to explore pathfinding algorithms on simple 2D grids.  To utilise these pathfinding algorithms (such as **A\***), I wanted to be able to test them on a dynamic grid, and as such, I decided to use the opportunity to learn - *at least a little* - <mark>Phaser 3</mark>.  Phaser 3 is a free, open source, HTML game framework, which allows you to create games using JavaScript, right in the browser.  Before looking into pathfinding algorithms, I wanted to create the ability to produce dynamic maps (2D grids) to test them, which ended up aligning perfectly with Phaser 3s <mark>tilemaps</mark>.

I won't go into how Phaser is setup, or how it needs to be run on a server, many [guides](https://phaser.io/tutorials/getting-started-phaser3) already exist that cover this topic.  I'll also assume you're aware of what a tilemap is and how they are created using [Tiled](https://www.mapeditor.org/).  The tileset I used is courtesy of *[@schwarnhild](https://itch.io/profile/schwarnhild)* and can be found at [itch.io](https://schwarnhild.itch.io/basic-tileset-and-asset-pack-32x32-pixels).

<hr/>

#### Creating The Tilemap

Before creating the Phaser game object, we need a tilemap image, as well as the JSON map file, obtained from Tiled.  You can find my tilemap image [here](/assets/projects/tilemap-editor/resources/tileset.png), and my JSON map file [here](/assets/projects/tilemap-editor/resources/tilemap.json).  If you're creating your own tile JSON map, you'll want to essentially create a *main area* where tiles can be placed and a *selection area* at the bottom where all available tiles to be placed are located (a palette if you will), separated by a single tile height of space, which creates two distinct areas. 

<figure>
    <img class="rounded" src="/assets/images/posts/{{ page.title }}/img1.png" alt="Tilemap layout">
    <figcaption>Tilemap layout</figcaption>
</figure>

Once a tileset and JSON tilemap are in place, create the basic Phaser setup.  Within the config, <code>width</code> and <code>height</code> should correspond to your tilemap size.  As my tilemap is 18x27 and my tiles are 32x32, the Phaser canvas should be 576x864.  Within the <code>preload()</code> function, ensure the tilemap JSON and tileset images are loaded.

<script src="https://gist.github.com/onemandan/dd6ad147454b972f12b5465c92011fad.js"></script>

This will leave you with a lovely black box corresponding to the config <code>width</code> and <code>height</code> properties. To actually load the tilemap, it needs to be initialised within the <code>create()</code> function.  Add a <code>_map</code> global variable and make the necessary calls to load the tilemap from the preloaded map key, and the tile layer utilising the preloaded tileset.

<script src="https://gist.github.com/onemandan/db8f3ca05434dfdc5a209e9960f5667d.js"></script>

Once refreshed, the tilemap should now be showing.

<figure>
    <img class="rounded" src="/assets/images/posts/{{ page.title }}/img2.png" alt="Tilemap intialised and loaded with tileset">
    <figcaption>Tilemap intialised and loaded with tileset</figcaption>
</figure>

The tile selection panel doesn't currently look like a palette... it should preferably be broken up to show the individual tiles.  This can be done by looping through the X and Y planes at the specific positions of the tile selection area, and creating line graphics to represent a grid.  The steps to do this are:
- Create a global <code>_mapDividerIndex</code> that corresponds to the Y index of the single tile height separator.  In my case, the main area is 18 tiles in height, as the tilemap is 0 indexed, the separator is at a Y index of 18.
- Create a simple <code>CreateGraphic()</code> function and pass in <code>scene</code>, <code>width</code>, <code>height</code>, <code>weight</code>, <code>colour</code> and <code>position</code> variables.
- Loop through the X plane per tile to place a line every tile width.
- Loop through the Y plane per tile, from the <code>_mapDividerIndex</code> to place a line every tile height.

<code>_map</code> has a few handy attributes, such as <code>.height</code>, <code>.width</code>, <code>.tileWidth</code> and <code>.tileHeight</code> which makes this very simple.

<script src="https://gist.github.com/onemandan/9b726449f1c625490b580f30c3cd9b9b.js"></script>

As <code>_map.height</code> and <code>_map.width</code> are represented as height/width in tiles, they can simply be multiplied by <code>_map.tileHeight</code> and <code>_map.tileWidth</code> to obtain the sizes for the grid lines (taking into account <code>_mapDividerIndex</code>).  The above will have created a black grid over the tile selection palette area.

<figure>
    <img class="rounded" src="/assets/images/posts/{{ page.title }}/img3.png" alt="Tile selection palette area with grid">
    <figcaption>Tile selection palette area with grid</figcaption>
</figure>

<hr/>

#### Creating Markers

That's looking a lot better! The tile selection palette now looks like it has selectable tiles, although currently there isn't a way to know which tile has been selected.  There should be a marker for the main area to show where the selected tile will be placed, as well as a marker in the tile selection palette to show which tile has been selected.  The <code>CreateGraphic()</code> function can be reused to create the markers.  Global colour variables should also be used when passing the <code>colour</code> variable to keep things tidy.

<script src="https://gist.github.com/onemandan/4c00ed7db316948ddcef6bb1e02d656c.js"></script>

Note that a variable was passed to the <code>CreateGraphic()</code> function for the Y position using the attribute <code>_map.tileToWorldY</code>, which converts a tile index to a world space position.  The above will create two markers, just above and below <code>_mapDividerIndex</code>, the main area marker being white, and the tile selection marker being orange.

<figure>
    <img class="rounded" src="/assets/images/posts/{{ page.title }}/img4.png" alt="Tilemap with markers">
    <figcaption>Tilemap with markers</figcaption>
</figure>

What good are markers if they don't move?  The <code>update()</code> function can be utilised to remedy this, with the following considerations:
- Ensure that the current mouse position is within the tilemap area.
    - To counteract any errors that may occur when attempting to select tiles outside of the tilemap area.
- Determine which area (main/selection palette) the mouse pointer is in by utilising <code>_mapDividerIndex</code>.
- The main marker should display the current tile that the mouse is hovering over within the main area.
- The tile selection marker should display the current selected tile within the tile selection palette.
    - Store the selected tile from the tile selection palette, creating a new global <code>_tileIndex</code>.

The tilemap is in a space defined by tile indexes', whereas the mouse position is in world space.  Fortunately, tilemap functions such as <code>worldToTileX()</code> and <code>worldToTileY()</code> converts these spaces, and the scene has an <code>input</code> namespace for I/O operations.  Each tile within the tilemap also has an <code>.index</code> attribute, which corresponds to its tile ID within the tileset, which can be used to determine which tile has been selected within the tile selection palette.

<script src="https://gist.github.com/onemandan/ae3795b85db1f4984ac86da74cd6a1c2.js"></script>

When the mouse is within the main tile area, the main tile marker will correspond with its position.  When the mouse is pressed within the tile selection area, the tile selection marker will show which tile is selected.  This will also only be processed when the mouse is within the bounds of the tilemap.

<figure>
    <img class="rounded" src="/assets/images/posts/{{ page.title }}/img5.gif" alt="Tilemap markers positions' updating">
    <figcaption>Tilemap markers positions' updating</figcaption>
</figure>

<hr/>

#### Placing Tiles

A tilemap has been loaded, the palette is clearly defined and there are markers showing hovered/selected tiles within the main and selection areas respectively.  It's time to actually place some tiles... almost.  A tile preview should be created so that within the main selection area marker, the tile that has been selected and is to be placed can be seen, before it is placed.  Tilemaps within Phaser use layers, so that decoration and asset layers can be placed upon the main layer.  This can be used to our advantage, in the sense of a preview layer, where the preview tile can be placed at the main markers position (the mouse position).  If this position is saved, it can be checked within the <code>update()</code> function to compare it to the current position, and if it is different, remove the tile at the previous position within the preview layer.  First and foremost:
- Create new global variables to hold the main and preview layer keys.
- Update the tilemap creation within the <code>create()</code> function to create a new blank layer, for the preview layer.
    - When creating the blank layer, the function <code>setAlpha()</code> can be used on the layer to set its opacity.

<script src="https://gist.github.com/onemandan/c4548a47adcbf93b873824b614892f54.js"></script>

The tilemap will now consist of two layers, the main layer, as derived from the JSON tilemap (named *'Tile Layer 1'* as default) and the preview layer (named *'Tile Layer 2'* for consistency).  A function <code>UpdatePreviewTile()</code> needs to be created and another global variable <code>_previewTile</code> to hold the position of the preview tile.  So after the tilemap creation has been updated:
- Create a new global variable object to hold the preview tile position
- Create the <code>UpdatePreviewTile()</code> function, which will:
    - Switch the <code>_map</code> layer to the preview layer.
    - Place a tile at the main area markers position (mouse position), utilising <code>_tileIndex</code>.
    - Check whether or not the previous preview tile needs to be removed, based on <code>_previewTile</code> and update the position if this is the case.
    - Switch the <code>_map</code> layer back to the main layer.
- Call the <code>UpdatePreviewTile()</code> within the <code>create()</code> function to initialise the preview tile
- Call the <code>UpdatePreviewTile()</code> within the <code>update()</code> function to update the preview tile

<script src="https://gist.github.com/onemandan/309574c020bd5e3da045260205fc6e69.js"></script>

When a tile is selected from the tile selection palette and the mouse returns to the main tile area, the preview tile will update on the preview layer.
    
<figure>
    <img class="rounded" src="/assets/images/posts/{{ page.title }}/img6.gif" alt="Preview tiles">
    <figcaption>Preview tiles</figcaption>
</figure>
    
It is finally time to place a tile selected from the tile selection palette.  Simply, add a <code>_map.putTileAt()</code> function call within a mousedown event utilising the <code>_tileIndex</code> within the <code>update()</code> function.

<script src="https://gist.github.com/onemandan/137a1b82772bc1ce1a5d2f08408971ae.js"></script>

And there you have it, a simple tilemap editor created using Phaser 3!

<figure>
    <img class="rounded" src="/assets/images/posts/{{ page.title }}/img7.gif" alt="Finally placing some tiles">
    <figcaption>Finally placing some tiles</figcaption>
</figure>

<hr/>

#### Further Considerations

There are a few improvements that can be made, which I won't go into detail how to create, but are able to be reviewed via the <a href="/assets/projects/tilemap-editor/js/tilemap-editor.js">final project code</a>.
- Utilise arrow keys to move the tile selection marker.
    - Allow the tile selection marker to wrap to the opposite side of the tile selection area.
- Update the <code>UpdateTilePreview()</code> function so that the preview tile is updated prior to the mouse returning to the main tile area.
- Add some helper text within the separator.
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    