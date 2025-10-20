
interface IFeatures {
    type: 'Feature';
    properties: {
        adcode: number;
        name: string;
        center: number[];
        centroid: number[];
        childrenNum: number;
        level: string;
        parent: {
            adcode: number | null;
        };
    };
    geometry: {
        type: 'MultiPolygon';
        coordinates: number[][][][];
    };
}
export interface IData {
    type: 'FeatureCollection';
    features: IFeatures[];
}