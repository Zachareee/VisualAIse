import clustering from "density-clustering"
import { stripTag } from "./mirohighlevel.mjs"

const dbscan = new clustering.DBSCAN()
export const defaultRadius = 300
const defaultPoints = 2

export function findClusters(data, radius = defaultRadius, minPoints = defaultPoints) {
    const points = [], names = []
    data.forEach(e => {
        const { position: { x, y }, data: { title } } = e
        points.push([x, y])
        names.push(stripTag(title))
    });

    const clusters = dbscan.run(points, radius, minPoints)

    return clusters.map(cluster => cluster.map(idx => names[idx]))
}
// Code adapted from https://github.com/AndreyGermanov/yolov8_onnx_nodejs/blob/main/object_detector.js
/*import ort from "onnxruntime-node"
import sharp from "sharp"

// tensor only allows 640(?)
const imageRes = 640

async function readImage(path) {
    const image = sharp(path)
    const metadata = await image.metadata()
    const { width, height } = metadata

    const pixels = await image.removeAlpha()
        .resize(imageRes, imageRes)
        .raw()
        .toBuffer()

    const output = []
    for (var i = 0; i < 3; i++) {
        for (var j = i; j < pixels.length; j += 3) output.push(pixels[j])
    }

    return { width, height, output }
}

async function runModel({ output: input }) {
    const model = await ort.InferenceSession.create("yolov8m.onnx")
    const output = new ort.Tensor(Float32Array.from(input), [1, 3, imageRes, imageRes])

    const data = await model.run({ images: output })
    console.log(data)
    return data["output0"].data
}

readImage("screenshots/ss.png").then(output => runModel(output))*/