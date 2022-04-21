/*-------------------------------------------------------------------
|  File: service-worker.js
|
|  Purpose:  This file handles the creation of a service worker that
|            enables the website to function as a PWA. 
| 
|
|  Author: Jordan Davis (4/27/2022)
|
|
|  Change Log:
|
*-------------------------------------------------------------------*/

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.2/workbox-sw.js');

workbox.routing.registerRoute(
    ({request}) => request.destination === 'image',
    new workbox.strategies.NetworkFirst()
);
