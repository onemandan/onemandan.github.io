---
layout: post
title: Pathfinding from A to B
description: Pathfinding with the A* algorithm utilising Phaser 3 tilemaps
icon: fa-compass
tags:
    - Phaser 3
    - JavaScript
---

I've previously created a [Tilemap Editor](/2023/02/12/tilemap-editor.html) utilising Phaser 3 and it was originally my plan to use this as a basis to explore pathfinding.  However, I realised that it would be more beneficial to showcase pathfinding with a larger tilemap, which would be randomly generated with a multitude of terrain weights.

<div class="alert alert-info" role="alert">
    <div class="d-flex justify-content-center">
        <span>
            <strong>Note:</strong> Access and use the final project <a href="/projects/pathfinding.html">here</a>.  Review the code <a href="https://github.com/onemandan/onemandan.github.io/blob/main//assets/projects/pathfinding/js/pathfinding.js">here</a>.
        </span>
    </div>
</div>

<hr/>

{: .text-center}
#### Generating a Map

To pathfind from a start point, to an end point, an actual map is required so that it can be traversed.  In this case, a simple grid created from a 2D array will suffice.  As Phaser 3 is being utilised, a tilemap can be used and initialised with a grid.  The tilemap expects each point within the grid to relate to a tile index from a tileset.  To make the pathfinding interesting, traversal weights will be attached to each tile within the tilemap.  The tileset itself can be used to infer the weight of the tile - if 10 seperate weights are to be used, simply create a tileset with 10 tiles, each visually representing their corresponding weight.  I did this by creating 10 tiles from white to black, the first tile (white) would have an index of 1 within the tileset, and therefore also has a weight of 1 to traverse.

A simple function can be created to generate a grid from a 2D array, setting each element within it to a random value, within the index range of the created tileset.  This can then be used to create the data for the tilemap, producing a grid of tiles that have varying weights.

<script src="https://gist.github.com/onemandan/29b09b4c4670a2ba7020433f351c2b93.js"></script>

<figure class="text-center">
    <img class="rounded" src="/assets/images/posts/{{ page.title }}/img1.png" alt="Tilemap randomly generated">
    <figcaption>Tilemap randomly generated</figcaption>
</figure>

Having a randomised grid is a little bit underwhelming, it'd be much more interesting if it had a touch of *meaning*.  It is a common practice to use noise as a building block, and there is an incredible, highly detailed [write-up](https://www.redblobgames.com/maps/terrain-from-noise/) on this topic, which I would recommend.  Using this [simplex noise implementation](https://github.com/jwagner/simplex-noise.js), with a few minor changes to the <code>GenerateMap()</code> function, the resulting grid can have clearly traversable and non-traversable areas.

<script src="https://gist.github.com/onemandan/5af4526ca832133bf57b063377137c3d.js"></script>

<figure class="text-center">
    <img class="rounded" src="/assets/images/posts/{{ page.title }}/img2.png" alt="Tilemap generated with noise">
    <figcaption>Tilemap generated with noise</figcaption>
</figure>

<hr/>

{: .text-center}
#### Navigating a Noisy Grid

It is easy to understand, that navigating the above tilemap from the bottom left corner, to the top right corner in the fastest way possible would simply mean avoiding the darker areas as they are more '*expensive*' to traverse, while going in a relatively straight line.  To do this programatically, pathfinding algorithms need to be utilised, which start at one element within a grid and explore the element's neighbours until the end point is reached, while storing a quickest route.  The A* algorithm - which is a variation of the Dijkstra's algorithm - uses heuristics, such as Manhattan distance to estimate traversal costs and is commonly used in games.  There are [countless write-ups](https://en.wikipedia.org/wiki/Pathfinding#Algorithms) that go into detail on how these pathfinding algorithms work and for A*, the pseudocode is:

{% highlight js %}
function A*(start,goal)
    closedset := the empty set // The set of nodes already evaluated.
    openset := {start} // The set of tentative nodes to be evaluated, initially containing the start node
    came_from := the empty map // The map of navigated nodes.
 
    g_score[start] := 0 // Cost from start along best known path.
    // Estimated total cost from start to goal through y.
    f_score[start] := g_score[start] + heuristic_cost_estimate(start, goal)
 
    while openset is not empty
        current := the node in openset having the lowest f_score[] value
        if current = goal
            return reconstruct_path(came_from, goal)
 
        remove current from openset
        add current to closedset
        for each neighbor in neighbor_nodes(current)
            if neighbor in closedset
                continue
            tentative_g_score := g_score[current] + dist_between(current,neighbor)
 
            if neighbor not in openset or tentative_g_score < g_score[neighbor] 
                came_from[neighbor] := current
                g_score[neighbor] := tentative_g_score
                f_score[neighbor] := g_score[neighbor] + heuristic_cost_estimate(neighbor, goal)
                if neighbor not in openset
                    add neighbor to openset
 
    return failure
{% endhighlight %}

Prior to even digesting the above psuedocode, the grid that will be searched needs to be prepared.  As A* compares elements within a grid based on scores, it would be best to employ a class to ensure all required data, such as 'g', 'h', 'f' scores, position, parent, weight and status' are stored.

<script src="https://gist.github.com/onemandan/c7c7c8a02ea59cbf72ee9bf999e48540.js"></script>

Once the framework is in place for the grid, the psuedocode can be stepped through.

{% highlight js %}
function A*(start,goal)
    closedset := the empty set // The set of nodes already evaluated.
    openset := {start} // The set of tentative nodes to be evaluated, initially containing the start node
    came_from := the empty map // The map of navigated nodes.
 
    g_score[start] := 0 // Cost from start along best known path.
    // Estimated total cost from start to goal through y.
    f_score[start] := g_score[start] + heuristic_cost_estimate(start, goal)
 
    while openset is not empty
{% endhighlight %}

- Initialise the open and closed lists.
    - A closed list does not necessarily need to be used, as it is only utilised once a node has been calculated.  An attribute can be used instead.
    - The start node needs to be added to the open list.
- Set the f score of the start node.
    - It isn't necessary to set the f score of the start node, as it will initially be the only node in the open list, and would immediately be added to the closed list.
    - A heuristic is used to calculate the distance between two points.  If diagonal movement is allowed, Euclidean would be used, otherwise Manhattan.
- Loop through the open list until it is empty.
    - The open list being empty means that a path has not been found.

<script src="https://gist.github.com/onemandan/d97b124a6675132730f93f283fa45937.js"></script>

{% highlight js %}
current := the node in openset having the lowest f_score[] value
{% endhighlight %}

<script src="https://gist.github.com/onemandan/1bce4f1583869d99da0c3dd4522207c7.js"></script>

{% highlight js %}
if current = goal
    return reconstruct_path(came_from, goal)
{% endhighlight %}

- The current node can simply be checked if it is equal to the end node for path completion.
- Each node has a parent, which can be traversed recursively to create the path.

<script src="https://gist.github.com/onemandan/25027723d9f46e292920c0027f7e7f78.js"></script>

{% highlight js %}
remove current from openset
add current to closedset
for each neighbor in neighbor_nodes(current)
    if neighbor in closedset
        continue
    tentative_g_score := g_score[current] + dist_between(current,neighbor)

    if neighbor not in openset or tentative_g_score < g_score[neighbor] 
        came_from[neighbor] := current
        g_score[neighbor] := tentative_g_score
        f_score[neighbor] := g_score[neighbor] + heuristic_cost_estimate(neighbor, goal)
        if neighbor not in openset
            add neighbor to openset
 
    return failure
{% endhighlight %}

- Loop through the neighbours of the current node.
    - Obtain the neighbours by creating a list of nodes relative to the current nodes' N, E, S and W.
- Only need to visit a neighbour node if it hasn't already been added to the closed list.
    - The nodes <code>.closed</code> attribute replaced the closed list, it is used in place of searching a closed list.
- Only need to (re)visit a neighbour node if it is either not on the open list, or a better score option is available.
    - The nodes <code>.visited</code> attribute is used in place of searching the open list.

<script src="https://gist.github.com/onemandan/e75c9c87e957c0122e968d4bb02cd48b.js"></script>

Adding a call to the <code>AStar()</code> function and utilising the Phaser tilemap <code>putTileAt()</code> function to visually place the returned path shows the traversed path from the start point, to the end point.  It can clearly be seen how the darker tiles are avoided due to their higher traversal cost.

<figure class="text-center">
    <img class="rounded" src="/assets/images/posts/{{ page.title }}/img3.png" alt="This is the way">
    <figcaption>This is the way</figcaption>
</figure>