---
layout: post
title: Excel Intersecting Timespans
description: Obtaining the amount of intersecting time between timespans in Excel, utilising VBA
icon: fa-file-excel
tags:
    - Excel
    - VBA
---

If you've ever worked with <code>HH:MM</code> times - or, god forbid... dates - in Excel, you are probably acutely aware of how much pain they can cause.  I stumbled upon a problem where I was required to obtain the amount of intersecting time between two timespans, each with a start and end time.  There was also no guarantee that the timespans didn't span midnight, or if they intersected at all, which was just another headache thrown into mix to deal with.

<hr/>

{: .text-center}
#### The Timeless Problem

A <code>HH:MM</code> time within Excel is a **double**, represented in the '*0-1*' range.  00:00 is 0, and also 1 (with an extra day).  12:00 is 0.5.  This tends to make working with timespans somewhat confusing.  Let's reframe the problem to better understand it using a simple timescale. 

<figure class="text-center">
    <img class="rounded" src="/assets/images/posts/{{ page.title }}/img1.png" alt="Timespan timescales">
    <figcaption>Timespan timescales</figcaption>
</figure>

From the image above, it's easy to see where the timespans intersect (or not).  But how can this be done programatically and with the granularity of minutes, not just hours?  To mimic the above, arrays of 1440 elements (number of minutes in a day) could be created. Flags could be set within the necessary indicies and then they could simply be compared.  This seems a little too wild...

<hr/>

{: .text-center}
#### The Median Solution

Fortunately, the <code>Median()</code> function has the ability to relieve the misery.  The median of a set of given numbers is the midpoint and since dates/times in Excel are **doubles** it can be used to obtain the midpoint of timespans.  The median of 12:00 (0.5) and 00:00 (1) is 18:00 (0.75).  The median of 12:00 (0.5), 00:00 (1) and 18:00 (0.75) is 18:00 (0.75).

Let's apply this knowledge to the green timespan above.
- Timespan 1, start time: 08:00, end time: 12:00
- Timespan 2, start time: 10:00, end time: 13:00

{% highlight vb %}
median1 = Median(08:00, 12:00, 10:00) 'Returns 10:00 
median2 = Median(08:00, 12:00, 13:00) 'Returns 12:00 
intersect = median2 - median1 'Returns 02:00
hours = intersect * 24 'Returns 2
{% endhighlight %}

voila, the amount of intersecting time between two timespans.  Producing this in VBA is extremely simple, although be aware the <code>Math</code> namespace does not contain the <code>Median()</code> function, and as such <code>WorksheetFunction</code> needs to be utilised.  To ensure a positive intersecting time, <code>Abs()</code> can be used.

<script src="https://gist.github.com/onemandan/32c62dc8c7abd1ef2d3ea395ae1e9139.js"></script>

If the timespans do not span midnight, the above solution is enough.  However, this will unfortunately not work as is for timespans that span midnight, due to the fact that once past midnight, the value increments from 0.  In this event, **if the end time is lower than the start time**, then the timespan spans midnight.  The end time can then be incremented by 1, to show that it is within the following day.  Both timespans need to be checked to determine if they span midnight.
- If both timespans span midnight, the end times of both need to be incremented
- If the first timespan spans midnight, then all times except the first start time needs to be incremented, and vice versa for the second timespan.

<script src="https://gist.github.com/onemandan/19b4e7a45456ad9fe4a055a1c8645ab5.js"></script>