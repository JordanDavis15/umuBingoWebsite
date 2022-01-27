To build the docker image:

```shell
npm run build
```

To run the built container:

```shell
npm run server
```

To publish the docker image:

```shell
docker login --username umubingo # you only need to do this once 
npm run publish
```
