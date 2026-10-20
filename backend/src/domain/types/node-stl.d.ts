declare module 'node-stl' {
    interface StlOptions {
        density?: number;
    }
    class NodeStl {
        constructor(pathOrBuffer: string | Buffer, options?: StlOptions);
        volume: number;
        weight: number;
        boundingBox: number[];
        area: number;
        centerOfMass: number[];
        isWatertight: boolean;
    }
    export = NodeStl;
}
